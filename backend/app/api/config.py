from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import get_db
from app.models.config import PromptVersion
from app.models.conversation import Conversation
from app.schemas import (
    PromptCreate, PromptUpdate, PromptResponse,
    ModelConfigUpdate, ToolToggle,
    ABTestRequest, ABTestResponse,
    PipelineAction
)
from app.agent.init_tools import tool_registry
from app.auth.permissions import require_roles
from datetime import datetime
import json

router = APIRouter(prefix='/api/config', tags=['config'],
                   dependencies=[Depends(require_roles('admin'))])

# ===== Prompt Version Management =====
@router.get('/prompts')
def list_prompts(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    q = db.query(PromptVersion)
    total = q.count()
    rows = q.order_by(PromptVersion.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        'total': total,
        'prompts': [{
            'id': r.id, 'name': r.name, 'content': r.content, 'status': r.status,
            'created_at': str(r.created_at) if r.created_at else None,
            'deployed_at': str(r.deployed_at) if r.deployed_at else None,
        } for r in rows]
    }

@router.post('/prompts', response_model=PromptResponse)
def create_prompt(data: PromptCreate, db: Session = Depends(get_db)):
    p = PromptVersion(name=data.name, content=data.content, status='draft')
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.put('/prompts/{prompt_id}', response_model=PromptResponse)
def update_prompt(prompt_id: int, data: PromptUpdate, db: Session = Depends(get_db)):
    p = db.query(PromptVersion).filter(PromptVersion.id == prompt_id).first()
    if not p:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.post('/prompts/{prompt_id}/deploy', response_model=PromptResponse)
def deploy_prompt(prompt_id: int, db: Session = Depends(get_db)):
    p = db.query(PromptVersion).filter(PromptVersion.id == prompt_id).first()
    if not p:
        raise HTTPException(404)
    # Set all others to history
    db.query(PromptVersion).filter(PromptVersion.status == 'online').update({'status': 'history'})
    p.status = 'online'
    p.deployed_at = datetime.now()
    db.commit()
    db.refresh(p)
    return p

@router.delete('/prompts/{prompt_id}')
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    p = db.query(PromptVersion).filter(PromptVersion.id == prompt_id).first()
    if not p:
        raise HTTPException(404)
    db.delete(p)
    db.commit()
    return {'message': 'ok'}

# ===== Model Config（共享配置，DeepSeekClient / TongyiVLClient 实际读取）=====
from app.config import MODEL_CONFIG as model_config

@router.get('/model-config')
def get_model_config():
    return model_config

@router.post('/model-config')
def update_model_config(data: ModelConfigUpdate):
    payload = data.model_dump()
    # 双保险：模型名前缀自动对齐 provider，避免前端漏传导致串供应商
    if payload.get("model_name", "").startswith("glm-"):
        payload["provider"] = "zhipu"
    elif payload.get("model_name", "").startswith("qwen-"):
        payload["provider"] = "tongyi"
    model_config.update(payload)
    return model_config

# ===== Tool Management =====
@router.get('/tools')
def list_tools():
    return [{'name': t.name, 'description': t.description, 'enabled': t.enabled, 'order': i}
            for i, t in enumerate(tool_registry.all_tools())]

@router.post('/tools/toggle')
def toggle_tool(data: ToolToggle):
    tool = tool_registry.get(data.tool_name)
    if not tool:
        raise HTTPException(404, f'工具 {data.tool_name} 不存在')
    tool.enabled = data.enabled
    # 持久化到 tool_configs，重启后端后依然生效
    try:
        from app.models import SessionLocal
        from app.models.config import ToolConfig
        db = SessionLocal()
        try:
            cfg = db.query(ToolConfig).filter(ToolConfig.tool_name == data.tool_name).first()
            if not cfg:
                cfg = ToolConfig(tool_name=data.tool_name, enabled=data.enabled)
                db.add(cfg)
            else:
                cfg.enabled = data.enabled
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"[config] persist tool state failed: {e}")
    return {'name': data.tool_name, 'enabled': tool.enabled}

@router.post('/tools/reorder')
def reorder_tools(data: list[ToolToggle]):
    for item in data:
        tool = tool_registry.get(item.tool_name)
        if tool:
            tool.enabled = item.enabled
    return {'message': 'ok'}

# ===== A/B Test =====
@router.post('/ab-test', response_model=ABTestResponse)
def run_ab_test(data: ABTestRequest):
    from app.services.ab_test import ABTestEngine
    engine = ABTestEngine()
    return engine.run(data.test_cases, data.config_a, data.config_b)

# ===== Pipeline (Approval Workflow) =====
@router.get('/pipeline')
def pipeline_status(db: Session = Depends(get_db)):
    from app.models.correction import Correction
    # 待修正 = 搭配师端“翻车案例”列表的可见数量，必须和 /api/stylist/conversations?status=pending 口径一致
    pending = db.query(Conversation).filter(
        Conversation.status == 'pending',
        Conversation.score <= 2
    ).count()
    fixed = db.query(Correction).filter(Correction.status == 'fixed').count()
    approved = db.query(Correction).filter(Correction.status == 'approved').count()
    deployed = db.query(Correction).filter(Correction.status == 'deployed').count()
    return {'pending': pending, 'fixed': fixed, 'approved': approved, 'deployed': deployed}

@router.get('/pipeline/corrections')
def list_pipeline_corrections(status: str = '', page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    """配置端审核通道：列出待审核/全部纠错案例，附带原始用户提问。"""
    from app.models.correction import Correction
    q = db.query(Correction)
    if status == 'fixed':
        # 配置端审核通道展示“已修正待批准”的纠错。
        # 兼容历史数据：搭配师端此前提交后纠错停留在 pending（但已填写正确答案），
        # 同样视为待审核，避免这些案例在配置端“找不到”。
        q = q.filter(Correction.status.in_(['fixed', 'pending']))
        q = q.filter(Correction.correct_response.isnot(None), Correction.correct_response != '')
    elif status == 'review':
        # 配置端审核+发布台：展示已修正（待批准）和已批准（待发布）的案例。
        q = q.filter(Correction.status.in_(['fixed', 'approved', 'pending']))
        q = q.filter(Correction.correct_response.isnot(None), Correction.correct_response != '')
    elif status:
        q = q.filter(Correction.status == status)
    total = q.count()
    rows = q.order_by(Correction.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    result = []
    for r in rows:
        conv = None
        if r.conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == r.conversation_id).first()
        result.append({
            'id': r.id,
            'conversation_id': r.conversation_id,
            'user_input': conv.user_input if conv else '',
            'error_type': r.error_type,
            'correct_response': r.correct_response,
            'status': r.status,
        'created_at': str(r.created_at) if r.created_at else None,
    })
    return {'total': total, 'corrections': result}

@router.post('/pipeline/approve')
def approve_correction(data: PipelineAction, db: Session = Depends(get_db)):
    from app.models.correction import Correction
    from app.models.few_shot import FewShotExample
    corr = db.query(Correction).filter(Correction.id == data.correction_id).first()
    if not corr:
        raise HTTPException(404)
    synced_few_shot = False
    if data.action == 'approve':
        # 批准：已修正 -> 已批准（仅进入待发布队列，尚未写入 AI 范例库）
        if corr.status not in ('fixed', 'pending'):
            raise HTTPException(400, '仅已修正/待处理的纠错可批准')
        corr.status = 'approved'
    elif data.action == 'deploy':
        # 发布：已批准 -> 已上线，并同步进 few_shot_examples 让 AI 学习
        if corr.status != 'approved':
            raise HTTPException(400, '仅已批准的纠错可发布')
        corr.status = 'deployed'
        conv = None
        if corr.conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == corr.conversation_id).first()
        user_input = ''
        if conv and conv.user_input:
            user_input = conv.user_input
        elif corr.correct_response:
            user_input = corr.correct_response[:60]
        else:
            user_input = f'纠错案例{corr.id}'
        ex = FewShotExample(
            title=f'纠错案例#{corr.id}（{corr.error_type or "other"}）',
            user_input=user_input,
            correct_response=corr.correct_response or '',
            category=corr.error_type or 'correction',
        )
        db.add(ex)
        db.commit()
        try:
            from app.agent.few_shot_retriever import FewShotRetriever
            FewShotRetriever.refresh()
            synced_few_shot = True
        except Exception as e:
            print(f'[pipeline] few-shot cache refresh failed: {e}')
    elif data.action == 'reject':
        corr.status = 'rejected'
        # 退回给搭配师重新修正：对话状态恢复为 pending，搭配师端“翻车案例”列表
        # （查 Conversation.status='pending'）才能重新看到这条并再次提交。
        if corr.conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == corr.conversation_id).first()
            if conv:
                conv.status = 'pending'
    else:
        raise HTTPException(400, '未知操作')
    db.commit()
    return {'message': f'已{data.action}', 'status': corr.status, 'synced_few_shot': synced_few_shot}

# ===== System Monitoring =====
@router.get('/monitor')
def system_monitor():
    return {
        'status': 'running',
        'active_tools': [t.name for t in tool_registry.all_tools() if t.enabled],
        'total_tools': len(tool_registry.all_tools()),
        'current_model': model_config['model_name'],
        'temperature': model_config['temperature']
    }

# ===== Cost Monitoring（成本监控：防 AI 成本失控）=====
@router.get('/cost-stats')
def cost_stats(db: Session = Depends(get_db)):
    from app.models.cost import CostLog
    from sqlalchemy import func as sqlfunc
    from datetime import datetime, timedelta
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def agg(start):
        rows = db.query(CostLog).filter(CostLog.created_at >= start).all()
        return {
            'calls': len(rows),
            'tokens_in': sum(r.tokens_in for r in rows),
            'tokens_out': sum(r.tokens_out for r in rows),
            'cost': round(sum(r.cost for r in rows), 4),
        }

    # 近 30 天每日趋势
    d0 = today_start - timedelta(days=29)
    daily_rows = db.query(
        sqlfunc.date(CostLog.created_at),
        sqlfunc.count(CostLog.id),
        sqlfunc.sum(CostLog.tokens_in),
        sqlfunc.sum(CostLog.tokens_out),
        sqlfunc.sum(CostLog.cost),
    ).filter(CostLog.created_at >= d0).group_by(sqlfunc.date(CostLog.created_at)).all()
    daily_map = {}
    for d, c, tin, tout, cost in daily_rows:
        daily_map[str(d)] = {'calls': c or 0, 'tokens_in': int(tin or 0),
                             'tokens_out': int(tout or 0), 'cost': round(float(cost or 0), 4)}
    daily = []
    for i in range(30):
        day = (d0 + timedelta(days=i)).strftime('%Y-%m-%d')
        rec = daily_map.get(day, {'calls': 0, 'tokens_in': 0, 'tokens_out': 0, 'cost': 0.0})
        rec['date'] = day
        daily.append(rec)

    # 本月按类型拆分（llm / image）
    by_type_rows = db.query(CostLog.call_type, sqlfunc.count(CostLog.id), sqlfunc.sum(CostLog.cost)).filter(
        CostLog.created_at >= month_start).group_by(CostLog.call_type).all()
    by_type = {t: {'calls': c or 0, 'cost': round(float(cost or 0), 4)} for t, c, cost in by_type_rows}

    return {
        'today': agg(today_start),
        'week': agg(week_start),
        'month': agg(month_start),
        'daily': daily,
        'by_type': by_type,
    }

# ===== Agent Trace Review（AI 推理轨迹审查，破除黑箱）=====
@router.get('/traces')
def list_traces(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    from app.models.trace import AgentTrace
    from sqlalchemy import func as sqlfunc
    sub = db.query(
        AgentTrace.session_id, AgentTrace.trace_type, AgentTrace.user_id,
        sqlfunc.min(AgentTrace.created_at).label('started_at'),
        sqlfunc.max(AgentTrace.created_at).label('ended_at'),
        sqlfunc.count(AgentTrace.id).label('steps'),
        sqlfunc.sum(AgentTrace.duration_ms).label('total_ms'),
    ).group_by(AgentTrace.session_id).subquery()
    total = db.query(sub).count()
    rows = db.query(sub).order_by(sub.c.ended_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        'total': total,
        'traces': [{
            'session_id': s, 'trace_type': tt, 'user_id': u,
            'started_at': str(started), 'ended_at': str(ended),
            'steps': steps or 0, 'total_ms': int(total_ms or 0),
        } for s, tt, u, started, ended, steps, total_ms in rows]
    }


@router.get('/traces/{session_id}')
def trace_steps(session_id: str, db: Session = Depends(get_db)):
    from app.models.trace import AgentTrace
    rows = db.query(AgentTrace).filter(AgentTrace.session_id == session_id).order_by(AgentTrace.step_index).all()
    return [{
        'step_index': r.step_index, 'step_type': r.step_type, 'tool_name': r.tool_name,
        'input_params': r.input_params, 'output_result': r.output_result,
        'duration_ms': r.duration_ms, 'llm_response': r.llm_response,
        'created_at': str(r.created_at),
    } for r in rows]
