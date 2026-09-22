from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Body
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from datetime import datetime, timedelta, date
import json
import time
from typing import Optional
from app.models import get_db
from app.models.user import User
from app.models.wardrobe import ClothingItem, WearLog
from app.models.conversation import Conversation, AgentStep
from app.schemas import (
    ClothingCreate, ClothingUpdate, ClothingResponse,
    ConversationResponse, RatingRequest,
    ChatRequest, ChatResponse,
    WardrobeAnalysisResponse, ItemCorrectionCreate
)
from app.auth.jwt import verify_token
from app.agent.tool_registry import ToolRegistry
from app.utils.outfit_collage import generate_outfit_collage, outfit_from_wardrobe, _pick_outfit_items
from app.services.scheduled import check_duplicate_purchase
import json

router = APIRouter(prefix='/api/user', tags=['user'])

# ===== 用户身份解析 =====
# 统一从登录 JWT 解析 user_id（无状态，后端不存储 token，重启不丢失）。
# 无效或缺失 token 一律拒绝，确保多用户隔离，避免未登录读到默认用户数据。
def resolve_user_id(authorization: str = Header(None), db: Session = Depends(get_db)) -> int:
    if authorization and authorization.startswith('Bearer '):
        payload = verify_token(authorization[7:])
        if payload and payload.get('sub'):
            try:
                uid = int(payload['sub'])
                from app.models.user import User
                user = db.query(User).filter(User.id == uid).first()
                if not user:
                    raise HTTPException(status_code=401, detail="用户不存在")
                if getattr(user, 'is_active', True) is False:
                    raise HTTPException(status_code=403, detail="账号已被禁用")
                return uid
            except HTTPException:
                raise
            except (ValueError, TypeError):
                pass
    raise HTTPException(status_code=401, detail="未登录或登录已失效")

# ===== Wardrobe =====
@router.get('/wardrobe', response_model=list[ClothingResponse])
def list_wardrobe(user_id: int = Depends(resolve_user_id), category: str = '', status: str = 'confirmed', db: Session = Depends(get_db)):
    q = db.query(ClothingItem).filter(ClothingItem.user_id == user_id)
    if status:
        q = q.filter(ClothingItem.status == status)
    if category:
        q = q.filter(ClothingItem.category == category)
    return q.order_by(ClothingItem.created_at.desc()).all()

@router.post('/wardrobe', response_model=ClothingResponse)
def add_clothing(data: ClothingCreate, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    item = ClothingItem(user_id=user_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put('/wardrobe/{item_id}', response_model=ClothingResponse)
def update_clothing(item_id: int, data: ClothingUpdate, db: Session = Depends(get_db)):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(404, '衣物不存在')
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

@router.delete('/wardrobe/{item_id}')
def delete_clothing(item_id: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id, ClothingItem.user_id == user_id).first()
    if not item:
        raise HTTPException(404, '衣物不存在')
    db.delete(item)
    db.commit()
    return {'message': 'ok'}

@router.post('/wardrobe/upload-image')
async def upload_image(file: UploadFile = File(...), user_id: int = Depends(resolve_user_id)):
    import uuid, os
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f'{uuid.uuid4()}.{ext}'
    path = f'{upload_dir}/{filename}'
    content = await file.read()
    with open(path, 'wb') as f:
        f.write(content)
    return {'url': f'/{path}'}

# ===== Conversation =====

def _is_follow_up(curr: Conversation, prev: Conversation) -> bool:
    """判断 curr 是否是 prev 的追问：时间邻近 + 短句/疑问语气。"""
    if not curr.created_at or not prev.created_at:
        return False
    gap = (curr.created_at - prev.created_at).total_seconds()
    if gap < 0 or gap > 900:  # 15 分钟内
        return False
    q = (curr.user_input or '').strip()
    if len(q) <= 12:
        return True
    # 追问语气词/标点
    if q[-1] in ('呢', '吗', '吧', '?'):
        return True
    return False


def _aggregate_conversations(rows: list[Conversation]) -> list[dict]:
    """把同一主题下的连续追问聚合为一个会话，返回可供 ConversationResponse 解析的字典列表。"""
    if not rows:
        return []
    # 按时间从早到晚聚合
    sorted_rows = sorted(rows, key=lambda r: r.created_at or r.id)
    groups: list[dict] = []
    for row in sorted_rows:
        if groups:
            last = groups[-1]
            last_conv = last['_obj']
            if _is_follow_up(row, last_conv):
                hist = json.loads(last.get('history') or '[]')
                # 第一次被追问时，先把父会话自己的第一轮补进 history
                if last.get('turn_count', 1) == 1 and not hist:
                    hist.append({'role': 'user', 'content': last['user_input'], 'image_url': last.get('user_image_url')})
                    hist.append({'role': 'agent', 'content': last.get('agent_response') or ''})
                hist.append({'role': 'user', 'content': row.user_input, 'image_url': row.user_image_url or None})
                hist.append({'role': 'agent', 'content': row.agent_response or ''})
                last['history'] = json.dumps(hist, ensure_ascii=False)
                last['agent_response'] = row.agent_response
                last['turn_count'] = last.get('turn_count', 1) + 1
                last['created_at'] = max(last.get('created_at'), row.created_at) if last.get('created_at') and row.created_at else (last.get('created_at') or row.created_at)
                if row.user_image_url and not last.get('user_image_url'):
                    last['user_image_url'] = row.user_image_url
                continue
        groups.append({
            'id': row.id,
            'user_id': row.user_id,
            'user_input': row.user_input,
            'agent_response': row.agent_response,
            'score': row.score,
            'feedback': row.feedback or '',
            'status': row.status or 'normal',
            'user_image_url': row.user_image_url or None,
            'history': row.history or '[]',
            'created_at': row.created_at,
            'turn_count': 1,
            '_obj': row,
        })
    # 按最新时间降序
    groups.sort(key=lambda g: g.get('created_at') or g['id'], reverse=True)
    for g in groups:
        g.pop('_obj', None)
    return groups


@router.get('/conversations', response_model=list[ConversationResponse])
def list_conversations(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    rows = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).limit(50).all()
    return _aggregate_conversations(rows)

@router.post('/conversations/rate')
def rate_conversation(data: RatingRequest, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == data.conversation_id).first()
    if not conv:
        raise HTTPException(404, '对话不存在')
    conv.score = data.score
    conv.feedback = data.feedback
    if data.score <= 2:
        conv.status = 'pending'
    db.commit()
    return {'message': 'ok'}

@router.delete('/conversations/{conv_id}')
def delete_conversation(conv_id: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == user_id).first()
    if not conv:
        raise HTTPException(404, '对话不存在')
    db.delete(conv)
    db.commit()
    return {'message': 'ok', 'deleted': conv_id}

# ===== Chat =====
@router.get('/chat')
def chat(
    user_input: str,
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    conversation_id: Optional[int] = None,
    image_url: Optional[str] = None,
    image_analysis: Optional[str] = None,
    user_id: int = Depends(resolve_user_id),
    db: Session = Depends(get_db)
):
    from app.agent.react_agent import ReActAgent
    from app.agent.init_tools import tool_registry

    # 多轮对话：有 conversation_id 则追加到同一条记录，否则新建
    if conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id, Conversation.user_id == user_id
        ).first()
        if not conv:
            raise HTTPException(404, '对话不存在')
    else:
        conv = Conversation(user_id=user_id, user_input=user_input)
        db.add(conv)
        db.commit()

    # 保存原始问题与图片地址；把图片分析作为一次性上下文注入 LLM
    conv.user_input = user_input
    if image_url:
        conv.user_image_url = image_url
    final_input = user_input
    if image_url or image_analysis:
        final_input = f"[图片分析：{image_analysis or ''}]\n{user_input}"

    history = json.loads(conv.history or '[]')
    agent = ReActAgent(tool_registry)
    result = agent.run(final_input, user_id=user_id, conversation_id=conv.id, city=city, lat=lat, lon=lon, history=history)

    # 追加历史并更新最新回复（保留原始问题与图片地址，不暴露图片分析文本）
    user_hist = {"role": "user", "content": user_input, "image_url": image_url}
    history.append(user_hist)
    history.append({"role": "agent", "content": result})
    conv.history = json.dumps(history, ensure_ascii=False)
    conv.agent_response = result
    db.commit()

    # 根据推荐文本生成搭配拼贴图，并返回推荐单品列表供前端卡片化展示
    # 关键：只有本轮 agent 真正调取了「衣橱类工具」才返回卡片，
    # 这样问"你好/天气/穿搭知识"等不涉及本人衣橱的问题，不会硬推衣柜单品卡片。
    # 例外：用户表达的是「购买/添置」意图（如"我想买件通勤外套"），此时应推荐新买的，
    # 而非展示衣橱里已有的单品，故即便 agent 调了衣橱工具也不出卡片。
    WARDROBE_TOOLS = {'get_wardrobe', 'get_my_outfits', 'check_outfit', 'search_similar_clothes'}

    def _is_shopping_intent(text: str) -> bool:
        """判定用户是否表达购买/添置新衣物的意图。
        命中则就算 agent 调了衣橱工具，也不展示「衣橱已有单品」卡片
        （买衣服=推荐新买，不是推已有的）。"""
        if not text:
            return False
        keys = ('买', '购', '下单', '添置', '入手', '剁手', '加购', '凑单',
                '淘', '逛', '选购', '该买', '要买', '想买', '打算买', '准备买',
                'shopping', 'purchase', 'buy')
        t = (text or '').lower()
        return any(k in t for k in keys)

    shopping_intent = _is_shopping_intent(user_input)
    used_wardrobe = bool(agent.used_tools & WARDROBE_TOOLS)

    item_dicts = []
    outfit_image = None
    if used_wardrobe and not shopping_intent:
        items = db.query(ClothingItem).filter(ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
        selected = _pick_outfit_items(result, items)
        outfit_image = generate_outfit_collage(result, items, conv.id, user_id=user_id)
        item_dicts = [{
            'id': it.id, 'name': it.name, 'category': it.category,
            'color': it.color or '', 'season': it.season or '',
            'image_url': it.image_url or '', 'style': it.style or '',
            'material': getattr(it, 'material', None) or '',
            'pattern': getattr(it, 'pattern', None) or '',
        } for it in selected]

    return ChatResponse(response=result, conversation_id=conv.id, steps=agent.logger.steps, outfit_image=outfit_image, items=item_dicts)

# ===== 'Today's Outfit' quick recommendation =====
@router.get('/today-outfit')
def today_outfit(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    from app.agent.init_tools import tool_registry
    from app.agent.react_agent import ReActAgent

    items = db.query(ClothingItem).filter(ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
    if not items:
        return {'recommendation': '你的衣橱还没有衣物，快去添加吧！', 'items': [], 'outfit_image': None}

    agent = ReActAgent(tool_registry)
    prompt = f'我的衣橱里有这些衣服：{json.dumps([{"name": i.name, "category": i.category, "color": i.color, "style": i.style, "season": i.season} for i in items])}。请根据今天天气为我推荐一套穿搭。'
    result = agent.run(prompt, user_id=user_id)

    conv = Conversation(user_id=user_id, user_input='今天穿什么？', agent_response=result)
    db.add(conv)
    db.commit()

    # 根据推荐文本生成搭配拼贴图
    outfit_image = generate_outfit_collage(result, items, conv.id, user_id=user_id)

    return {'recommendation': result, 'conversation_id': conv.id, 'outfit_image': outfit_image}


# ===== 首页：按天气从衣橱直接挑一套搭配 =====
@router.get('/outfit-by-weather')
def outfit_by_weather(
    temp: Optional[float] = None,
    weather: str = '',
    city: str = '',
    random_pick: bool = False,
    user_id: int = Depends(resolve_user_id),
    db: Session = Depends(get_db),
):
    """
    根据温度 / 天气，直接从已确认衣橱里挑一套搭配（上装/下装/鞋子/配饰），
    生成拼贴图并返回配文。无需调用大模型，秒级返回。
    """
    items = db.query(ClothingItem).filter(ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
    if not items:
        return {'text': '你的衣橱还没有衣物，先去添加吧！', 'image_url': None, 'items': []}
    tag = f'home_{user_id}'
    text, image_url, item_list = outfit_from_wardrobe(
        items, temp=temp, weather_desc=weather, tag=tag, random_pick=random_pick, city=city
    )
    return {'text': text, 'image_url': image_url, 'items': item_list}


# ===== 自主搭配 + AI 审核 =====
@router.post('/outfit-review')
def outfit_review(data: dict = Body(default={}), user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    """
    用户自己从衣橱挑选若干单品组成一套搭配，交由 AI 搭配师审核。
    入参：{"ids": [单品id, ...]}
    返回结构化审核结果：评分 / 结论 / 色彩·季节·场合·完整性点评 / 改进建议 / 搭配预览图。
    """
    ids = data.get('ids', []) if isinstance(data, dict) else []
    if not isinstance(ids, list) or len(ids) < 2:
        raise HTTPException(status_code=400, detail="请至少选择 2 件衣物进行搭配审核")

    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id, ClothingItem.id.in_(ids)
    ).all()
    if len(items) < 2:
        raise HTTPException(status_code=400, detail="选中的衣物无效，请重新选择")

    # 组装给 AI 的衣物描述（类别名映射为中文，便于模型理解）
    CAT_CN = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰',
              'outer': '外套', 'dress': '连衣裙'}
    desc = [
        {
            "名称": i.name,
            "类别": CAT_CN.get(i.category, i.category),
            "颜色": i.color or "未知",
            "风格": i.style or "未知",
            "季节": i.season or "未知",
            "场合": i.occasion or "未知",
        }
        for i in items
    ]
    desc_text = "\n".join(
        f"{d['名称']}（{d['类别']}，颜色：{d['颜色']}，风格：{d['风格']}，季节：{d['季节']}，场合：{d['场合']}）"
        for d in desc
    )
    prompt = (
        "用户自己搭配了一套服装，包含以下单品：\n"
        f"{desc_text}\n\n"
        "请你以专业服装搭配师的视角审核这套搭配，并从以下维度给出评价：\n"
        "1. 色彩协调度：颜色搭配是否和谐；\n"
        "2. 季节是否合适：单品季节属性是否一致、是否适合当前季节；\n"
        "3. 场合是否得体：整体风格是否统一、是否适合通勤/休闲/正式等场景；\n"
        "4. 完整性（请遵循以下规则判断，不要机械要求四件套）：\n"
        "   · 下装可由「下装」或「连衣裙」其一提供，有连衣裙即视为已覆盖下装；\n"
        "   · 寒冷场景下「外套」作为外层覆盖上装，此时不必强求额外上装；\n"
        "   · 若出现 2 件及以上「上装」，通常是有意的叠穿（如衬衫+针织开衫），应肯定其层次感，不要判为冗余；\n"
        "   · 鞋子与配饰为加分项，缺失可给建议但不必重扣完整性；\n"
        "   · 仅当明显缺失关键外层（如寒冬无外套）或上下装都没覆盖时，才判为不完整。\n"
        "5. 给出 1-10 的搭配评分（score）；\n"
        "6. 给出 1-3 条具体、可操作的改进建议（suggestions）。\n\n"
        "请严格以如下 JSON 格式返回（不要使用 markdown 代码块包裹）：\n"
        '{"score": 8, "verdict": "优秀/合格/需改进", '
        '"color_comment": "...", "season_comment": "...", "occasion_comment": "...", '
        '"completeness_comment": "...", "suggestions": ["...", "..."]}'
    )

    system = "你是一位经验丰富的专业服装搭配师，点评简洁、专业、有建设性。"

    # 记录推理轨迹（输入）
    _session = f"outfit_{user_id}_{int(time.time() * 1000)}"
    try:
        from app.agent.agent_logger import AgentLogger
        AgentLogger().log_step(session_id=_session, user_id=user_id, trace_type="outfit_review",
                               step_index=0, step_type="input", input_params=prompt[:2000])
    except Exception:
        pass

    try:
        from app.llm import get_llm_client
        client = get_llm_client()
        resp = client.chat([
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ], user_id=user_id)
        content = resp["choices"][0]["message"]["content"]
    except Exception as e:
        content = ""
        print("outfit review llm failed:", e)

    # 记录推理轨迹（输出）
    try:
        from app.agent.agent_logger import AgentLogger
        AgentLogger().log_step(session_id=_session, user_id=user_id, trace_type="outfit_review",
                               step_index=1, step_type="llm_response",
                               output_result=(content or "")[:4000], llm_response=(content or "")[:4000])
    except Exception:
        pass

    # 解析 JSON（兼容 ```json 包裹 / 多余文本）
    review = {
        "score": None,
        "verdict": None,
        "color_comment": "",
        "season_comment": "",
        "occasion_comment": "",
        "completeness_comment": "",
        "suggestions": [],
        "raw": content,
    }
    if content:
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        if "{" in clean and "}" in clean:
            clean = clean[clean.index("{"): clean.rindex("}") + 1]
        try:
            parsed = json.loads(clean)
            review["score"] = parsed.get("score")
            review["verdict"] = parsed.get("verdict")
            review["color_comment"] = parsed.get("color_comment", "")
            review["season_comment"] = parsed.get("season_comment", "")
            review["occasion_comment"] = parsed.get("occasion_comment", "")
            review["completeness_comment"] = parsed.get("completeness_comment", "")
            review["suggestions"] = parsed.get("suggestions", []) or []
        except Exception:
            # 解析失败：把原文整体作为评语兜底
            review["color_comment"] = content

    # 审核结果不再生成拼贴图，改由前端用衣橱卡片展示搭配单品
    image_url = None

    return {
        "score": review["score"],
        "verdict": review["verdict"],
        "color_comment": review["color_comment"],
        "season_comment": review["season_comment"],
        "occasion_comment": review["occasion_comment"],
        "completeness_comment": review["completeness_comment"],
        "suggestions": review["suggestions"],
        "image_url": image_url,
        "raw": review["raw"],
    }


# ===== Wardrobe Analysis =====
@router.get('/wardrobe-analysis')
def wardrobe_analysis(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
    if not items:
        return WardrobeAnalysisResponse(
            total_items=0, category_distribution={}, season_distribution={},
            color_distribution={}, unused_items=[], duplicate_warnings=[], suggestions=['你的衣橱还是空的，去添加衣物吧！']
        )

    total = len(items)
    cats = {}
    seasons = {}
    colors = {}
    today = date.today()
    unused = []
    for i in items:
        cats[i.category] = cats.get(i.category, 0) + 1
        if i.season:
            seasons[i.season] = seasons.get(i.season, 0) + 1
        if i.color:
            colors[i.color] = colors.get(i.color, 0) + 1
        days_owned = (today - i.purchase_date).days if i.purchase_date else None
        days_idle = (today - i.last_worn).days if i.last_worn else None
        # 闲置判定：超过 90 天没穿；或购入超 90 天且从未记录穿过
        is_idle = False
        if i.last_worn and days_idle > 90:
            is_idle = True
        elif (i.last_worn is None) and i.purchase_date and days_owned > 90:
            is_idle = True
        detail = {
            'id': i.id, 'name': i.name, 'category': i.category,
            'purchase_date': str(i.purchase_date) if i.purchase_date else None,
            'last_worn': str(i.last_worn) if i.last_worn else None,
            'wear_count': i.wear_count or 0,
            'days_owned': days_owned,
            'days_idle': days_idle,
            'is_idle': is_idle,
        }
        if is_idle:
            unused.append(detail)

    # Duplicate warnings（同名视为重复购买）
    name_counts = {}
    for i in items:
        name_counts[i.name] = name_counts.get(i.name, 0) + 1
    dupes = [{'name': n, 'count': c} for n, c in name_counts.items() if c > 1]

    suggestions = []
    has_upper = 'top' in cats or 'dress' in cats
    has_lower = 'bottom' in cats or 'dress' in cats
    if not has_upper or not has_lower:
        suggestions.append('你的衣橱缺少基础搭配品类，建议补充上装/下装或连衣裙。')
    if unused:
        suggestions.append(f'你有 {len(unused)} 件衣物超过 90 天没穿，建议处理。')
        for u in unused[:3]:
            if (u['days_owned'] or 0) > 180 and u['wear_count'] < 10:
                advice = '建议淘汰或捐赠'
            else:
                advice = '建议搭配再利用'
            idle_txt = f'已 {u["days_idle"]} 天没穿' if u['days_idle'] is not None else f'购入 {u["days_owned"]} 天未穿'
            suggestions.append(f'「{u["name"]}」{idle_txt}（购入 {u["days_owned"]} 天，仅穿 {u["wear_count"]} 次），{advice}。')
    if dupes:
        suggestions.append(f'有 {len(dupes)} 种衣物存在重复购买的情况。')

    return WardrobeAnalysisResponse(
        total_items=total, category_distribution=cats, season_distribution=seasons,
        color_distribution=colors, unused_items=unused, duplicate_warnings=dupes, suggestions=suggestions
    )

# ===== Shopping List Suggestions =====
@router.get('/shopping-list')
def shopping_list(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
    cats = {i.category for i in items}
    has_upper = 'top' in cats or 'dress' in cats
    has_lower = 'bottom' in cats or 'dress' in cats
    suggestions = []
    if not has_upper:
        suggestions.append({'category': 'top', 'reason': '缺少上装或连衣裙'})
    if not has_lower:
        suggestions.append({'category': 'bottom', 'reason': '缺少下装或连衣裙'})
    if 'shoes' not in cats:
        suggestions.append({'category': 'shoes', 'reason': '缺少鞋子'})
    if 'outer' not in cats:
        suggestions.append({'category': 'outer', 'reason': '缺少外套，降温或换季时可用'})
    return {'suggestions': suggestions}
@router.post('/analyze-image')
async def analyze_image(file: UploadFile = File(...), user_id: int = Depends(resolve_user_id)):
    import uuid, os, base64
    upload_dir = os.path.join(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads'), 'temp')
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f'{uuid.uuid4()}.{ext}'
    path = f'{upload_dir}/{filename}'
    content = await file.read()
    with open(path, 'wb') as f:
        f.write(content)

    b64 = base64.b64encode(content).decode('utf-8')
    from app.llm.tongyi_vl import TongyiVLClient
    client = TongyiVLClient()
    prompt = '请详细描述这张图片中的衣物：类别（上装/下装/鞋子/配饰）、颜色、风格、适合的季节和场合。以JSON格式返回。'
    result = client.analyze_image(b64, prompt)
    return {'image_url': f'/uploads/temp/{filename}', 'analysis': result}


@router.post('/wardrobe/upload-and-tag')
async def upload_and_tag(file: UploadFile = File(...), user_id: int = Depends(resolve_user_id), purchase_date: str = Form(None), status: str = Form('confirmed'), db: Session = Depends(get_db)):
    import uuid, os, base64, json
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    content = await file.read()

    # 1) YOLOv8 检测衣物区域并裁剪（无可靠区域则回退整图）
    crop_content = None
    try:
        from app.vision.detector import crop_for_vl
        crop_content = crop_for_vl(content)
    except Exception as e:
        print(f'[upload] yolo detect failed: {e}')
    analysis_content = crop_content or content

    # 2) AI 抠图去背景（失败则保留原图，绝不阻断上传）
    processed = None
    try:
        from app.utils.remove_bg import remove_background
        processed = remove_background(analysis_content)
    except Exception:
        processed = None
    if processed:
        ext = 'png'
        save_content = processed
    else:
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        save_content = analysis_content

    filename = f'{uuid.uuid4()}.{ext}'
    path = f'{upload_dir}/{filename}'
    with open(path, 'wb') as f:
        f.write(save_content)

    b64 = base64.b64encode(analysis_content).decode('utf-8')
    from app.llm.tongyi_vl import TongyiVLClient
    client = TongyiVLClient()
    prompt = (
        '你是一个专业的服装识别系统。请分析这张图片中的衣物，返回严格的JSON格式（不要markdown包裹）：'
        '{"name": "衣物名称", "category": "top/bottom/shoes/accessory/outer/dress", '
        '"color": "主要颜色", "style": "风格描述", "material": "材质，如棉/麻/丝/牛仔/聚酯", '
        '"pattern": "图案，如纯色/条纹/格纹/碎花", '
        '"season": "春夏/秋冬", "occasion": "正式/休闲/运动"}'
    )
    try:
        result = client.analyze_image(b64, prompt)
        clean = result.strip()
        if clean.startswith('```'):
            clean = clean.split('\n', 1)[-1]
            clean = clean.rsplit('\n```', 1)[0]
        if '{' in clean and '}' in clean:
            clean = clean[clean.index('{'):clean.rindex('}')+1]
        tags = json.loads(clean)
    except Exception:
        # AI 识别失败（网络/接口异常/解析失败）时，仍创建衣物并允许用户手动填写
        tags = {'name': file.filename, 'category': 'top', 'color': '', 'style': '', 'material': '', 'pattern': '', 'season': '', 'occasion': ''}

    from app.models.wardrobe import ClothingItem
    # 解析购入日期
    pd = None
    if purchase_date:
        try:
            pd = date.fromisoformat(purchase_date)
        except Exception:
            pd = None
    item = ClothingItem(
        user_id=user_id,
        name=tags.get('name', file.filename),
        category=tags.get('category', 'top'),
        color=tags.get('color', ''),
        style=tags.get('style', ''),
        material=tags.get('material', ''),
        pattern=tags.get('pattern', ''),
        season=tags.get('season', ''),
        occasion=tags.get('occasion', ''),
        image_url=f'http://localhost:8000/uploads/{filename}',
        status=status,
        purchase_date=pd,
        last_worn=None,
        wear_count=0
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # 自动打标签：把 AI 识别出的 category/color/style/season/occasion 与线上 tags 表
    # name 精确匹配，命中的写入 item.tags，让标签真正落到单品上（展示 + 推荐参考）。
    try:
        from app.models.tag import Tag
        tag_names = {t.name for t in db.query(Tag.name).all()}
        matched = []
        for v in [item.category, item.color, item.style, item.season, item.occasion]:
            if v and v in tag_names:
                matched.append(v)
        if matched:
            item.tags = json.dumps(matched, ensure_ascii=False)
            db.commit()
    except Exception as e:
        print(f'[upload] auto-tag failed: {e}')

    # 3) CLIP 图像向量化入库（用于语义相似款检索；失败不阻断）
    try:
        from app.vision.clothing_embedder import ClothingEmbedder
        from app.services import clothing_search
        vec = ClothingEmbedder.embed_image(save_content)
        if vec:
            clothing_search.add_clothing_vector(item.id, vec, {
                'user_id': user_id, 'name': item.name, 'category': item.category,
                'color': item.color or '', 'style': item.style or '',
            })
    except Exception as e:
        print(f'[upload] clothing embed failed: {e}')

    # 重复购买检测：返回相似衣物列表（不写通知，由前端提示）
    try:
        dup = check_duplicate_purchase(db, item)
    except Exception as e:
        print(f'duplicate check failed: {e}')
        dup = []

    return {'item': item, 'tags': tags, 'duplicate_warning': dup,
            'detected_crop': crop_content is not None}


# ===== 标记穿过（记录某天穿过某件，动态维护 last_worn / wear_count / 穿着历史）=====
@router.post('/wardrobe/mark-worn')
def mark_worn(data: dict, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    req = data if isinstance(data, dict) else {}
    ids = req.get('ids', []) or []
    # 支持回溯历史：可传 worn_date（YYYY-MM-DD），默认为今天
    worn_date = date.today()
    raw = req.get('worn_date')
    if raw:
        try:
            worn_date = date.fromisoformat(str(raw)[:10])
        except Exception:
            worn_date = date.today()
    updated = 0
    for iid in ids:
        item = db.query(ClothingItem).filter(
            ClothingItem.id == iid, ClothingItem.user_id == user_id
        ).first()
        if not item:
            continue
        # 同件同天只记一次，避免重复计数
        exists = db.query(WearLog).filter(
            WearLog.item_id == iid, WearLog.user_id == user_id, WearLog.worn_date == worn_date
        ).first()
        if not exists:
            db.add(WearLog(user_id=user_id, item_id=iid, worn_date=worn_date))
            item.wear_count = (item.wear_count or 0) + 1
        # last_worn 取所有穿着记录里最晚的一天
        if (item.last_worn is None) or (worn_date > item.last_worn):
            item.last_worn = worn_date
        updated += 1
    db.commit()
    return {'updated': updated, 'worn_date': str(worn_date)}


# ===== 穿着历史：某件衣服都在哪些天穿过 =====
@router.get('/wardrobe/wear-history')
def wear_history(item_id: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    rows = db.query(WearLog.worn_date).filter(
        WearLog.item_id == item_id, WearLog.user_id == user_id
    ).order_by(WearLog.worn_date.desc()).all()
    dates = [str(r[0]) for r in rows]
    return {'item_id': item_id, 'dates': dates, 'count': len(dates)}


# ===== 删除某条穿着记录 =====
@router.post('/wardrobe/wear-history/delete')
def delete_wear_history(data: dict, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    req = data if isinstance(data, dict) else {}
    item_id = req.get('item_id')
    worn_date = req.get('worn_date')
    if not item_id or not worn_date:
        return {'deleted': 0}
    try:
        target = datetime.strptime(str(worn_date)[:10], '%Y-%m-%d').date()
    except Exception:
        return {'deleted': 0}
    # 删除记录
    deleted = db.query(WearLog).filter(
        WearLog.item_id == item_id, WearLog.user_id == user_id, WearLog.worn_date == target
    ).delete(synchronize_session=False)
    if deleted:
        # 重新维护 wear_count 与 last_worn
        item = db.query(ClothingItem).filter(
            ClothingItem.id == item_id, ClothingItem.user_id == user_id
        ).first()
        if item:
            remaining = db.query(WearLog.worn_date).filter(
                WearLog.item_id == item_id, WearLog.user_id == user_id
            ).order_by(WearLog.worn_date.desc()).all()
            item.wear_count = len(remaining)
            item.last_worn = remaining[0][0] if remaining else None
    db.commit()
    return {'deleted': deleted}


# ===== 穿着历史：某一天穿了哪些衣服（识别「哪天穿了哪件」）=====
@router.get('/wardrobe/wear-by-date')
def wear_by_date(date: str, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    # 注意：参数名 date 会遮蔽 datetime.date，故用 datetime.strptime 解析
    try:
        target = datetime.strptime(str(date)[:10], '%Y-%m-%d').date()
    except Exception:
        return {'date': date, 'items': []}
    # 按用户取出后，用字符串比较日期，规避 SQLite 日期绑定差异
    rows = db.query(WearLog).filter(WearLog.user_id == user_id).all()
    matched = [r for r in rows if str(r.worn_date) == str(target)]
    items = []
    for r in matched:
        it = db.query(ClothingItem).filter(ClothingItem.id == r.item_id).first()
        if it:
            items.append({
                'id': it.id, 'name': it.name, 'category': it.category,
                'color': it.color or '', 'image_url': it.image_url or ''
            })
    return {'date': str(target), 'items': items}


# ===== 单品纠错（用户端上报 AI 识别错误）=====
@router.post('/item-corrections')
def create_user_item_correction(data: ItemCorrectionCreate, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    """用户发现 AI 识别衣橱单品出错（品类/颜色/材质等），在此上报。
    记录进入 pending，由搭配师端『单品纠错』审核应用，形成反馈数据集。"""
    from app.models.item_correction import ClothingItemCorrection
    it = db.query(ClothingItem).filter(
        ClothingItem.id == data.item_id, ClothingItem.user_id == user_id
    ).first()
    if not it:
        raise HTTPException(404, '单品不存在或不属于你')
    corr = ClothingItemCorrection(
        item_id=data.item_id, user_id=user_id,
        error_fields=json.dumps(data.error_fields, ensure_ascii=False),
        correct_attrs=json.dumps(data.correct_attrs, ensure_ascii=False),
        note=data.note or '', status='pending')
    db.add(corr)
    db.commit()
    db.refresh(corr)
    return {'id': corr.id, 'item_id': corr.item_id, 'status': corr.status}


# ===== 标签库（线上 tags 表，只读，供用户端给单品打标签选择）=====
@router.get('/tags')
def list_user_tags(db: Session = Depends(get_db)):
    from app.models.tag import Tag
    rows = db.query(Tag).order_by(Tag.category, Tag.name).all()
    return [{'id': t.id, 'name': t.name, 'category': t.category or '', 'color': t.color or ''} for t in rows]


