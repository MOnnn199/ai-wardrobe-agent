from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import Optional
from app.models import get_db
from app.models.conversation import Conversation
from app.models.correction import Correction
from app.models.few_shot import FewShotExample
from app.models.tag import Tag
from app.models.knowledge import KnowledgeChunk
from app.schemas import (
    CorrectionCreate, CorrectionUpdate, CorrectionResponse,
    FewShotExample as FewShotSchema,
    TagCreate, TagResponse,
    KnowledgeChunkResponse, RAGStatsResponse,
    ItemCorrectionCreate,
    GapStatusUpdate,
)
from app.rag.document_parser import DocumentParser
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore
from app.auth.permissions import require_roles
from app.services.knowledge_gap import semantic_cluster, topic_key
from app.models.knowledge_gap_status import KnowledgeGapStatus
from datetime import datetime, timedelta
import json, uuid

router = APIRouter(prefix='/api/stylist', tags=['stylist'],
                   dependencies=[Depends(require_roles('stylist', 'admin'))])

vector_store = VectorStore()
embedder = Embedder()
doc_parser = DocumentParser()

# ===== Conversations / Corrections =====
@router.get('/conversations')
def list_failed_conversations(status: str = 'pending', page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    q = db.query(Conversation)
    if status == 'pending':
        q = q.filter(Conversation.score <= 2, Conversation.status == 'pending')
    elif status == 'fixed':
        q = q.filter(Conversation.status == 'fixed')
    elif status == 'approved':
        q = q.filter(Conversation.status == 'approved')
    q = q.order_by(Conversation.id.asc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {'total': total, 'list': rows}

@router.get('/conversations/{conv_id}')
def get_conversation(conv_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(404)
    correction = db.query(Correction).filter(Correction.conversation_id == conv_id).first()
    return {'conversation': conv, 'correction': correction}

# ===== Corrections =====
@router.get('/corrections', response_model=list[CorrectionResponse])
def list_corrections(status: str = '', db: Session = Depends(get_db)):
    q = db.query(Correction)
    if status:
        q = q.filter(Correction.status == status)
    return q.order_by(Correction.id.asc()).all()

@router.post('/corrections', response_model=CorrectionResponse)
def create_correction(data: CorrectionCreate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == data.conversation_id).first()
    if not conv:
        raise HTTPException(404, '对话不存在')
    # upsert：同一对话的纠错只保留一条，避免反复编辑产生重复记录。
    # 搭配师“提交”即代表已给出正确答案，状态直接置为 fixed，进入配置端审核队列。
    corr = db.query(Correction).filter(Correction.conversation_id == data.conversation_id).first()
    if corr:
        corr.error_type = data.error_type
        corr.correct_response = data.correct_response
        corr.status = 'fixed'
    else:
        corr = Correction(
            conversation_id=data.conversation_id,
            stylist_id=data.stylist_id or 1,
            error_type=data.error_type,
            correct_response=data.correct_response,
            status='fixed'
        )
        db.add(corr)
    conv.status = 'fixed'
    db.commit()
    db.refresh(corr)
    return corr

@router.put('/corrections/{correction_id}', response_model=CorrectionResponse)
def update_correction(correction_id: int, data: CorrectionUpdate, db: Session = Depends(get_db)):
    corr = db.query(Correction).filter(Correction.id == correction_id).first()
    if not corr:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(corr, k, v)
    db.commit()
    db.refresh(corr)
    return corr

# ===== Few-Shot Examples =====
@router.get('/few-shot-examples')
def list_few_shot(category: str = '', page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    q = db.query(FewShotExample)
    if category:
        q = q.filter(FewShotExample.category == category)
    q = q.order_by(FewShotExample.id.asc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {'total': total, 'list': rows}

@router.post('/few-shot-examples')
def create_few_shot(data: FewShotSchema, db: Session = Depends(get_db)):
    example = FewShotExample(**data.model_dump(exclude={'id'}))
    db.add(example)
    db.commit()
    db.refresh(example)
    from app.agent.few_shot_retriever import FewShotRetriever
    FewShotRetriever.refresh()
    return example

@router.delete('/few-shot-examples/{example_id}')
def delete_few_shot(example_id: int, db: Session = Depends(get_db)):
    ex = db.query(FewShotExample).filter(FewShotExample.id == example_id).first()
    if not ex:
        raise HTTPException(404)
    db.delete(ex)
    db.commit()
    from app.agent.few_shot_retriever import FewShotRetriever
    FewShotRetriever.refresh()
    return {'message': 'ok'}

# ===== RAG Knowledge Management =====
@router.post('/knowledge/upload')
async def upload_knowledge(file: UploadFile = File(...), db: Session = Depends(get_db)):
    import tempfile, os
    allowed = {'txt', 'md', 'pdf'}
    suffix = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if suffix not in allowed:
        raise HTTPException(400, f'不支持的文件格式 .{suffix}，仅支持 {", ".join(allowed)}')

    with tempfile.NamedTemporaryFile(suffix=f'.{suffix}', delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        chunks = []
        if suffix == 'pdf':
            chunks = doc_parser.parse_pdf(tmp_path)
        else:
            chunks = doc_parser.parse_markdown(tmp_path)
    except UnicodeDecodeError:
        os.unlink(tmp_path)
        raise HTTPException(400, '文件编码错误，请上传 UTF-8 编码的文本文件')
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(400, f'文件解析失败：{str(e)}')
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass

    failed_embed = 0
    for i, chunk in enumerate(chunks):
        chunk_id = f'{uuid.uuid4().hex}'
        vec = embedder.embed(chunk)
        if vec is None:
            failed_embed += 1
            import random
            vec = [random.random() for _ in range(embedder.dimension)]
        vector_store.add_chunk(chunk_id, vec, chunk, {'source': file.filename, 'chunk_index': i})
        db_kc = KnowledgeChunk(chunk_id=chunk_id, source=file.filename, text=chunk)
        db.add(db_kc)

    db.commit()
    msg = f'成功上传 {len(chunks)} 个知识片段'
    if failed_embed:
        msg += f'（其中 {failed_embed} 个因 embedding 服务暂时不可用，已用占位向量存储，文本内容完整保留）'
    return {'message': msg, 'count': len(chunks)}

@router.get('/knowledge/chunks')
def list_knowledge_chunks(source: str = '', page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    q = db.query(KnowledgeChunk)
    if source:
        q = q.filter(KnowledgeChunk.source == source)
    q = q.order_by(KnowledgeChunk.id.asc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    return {'total': total, 'list': rows}

@router.delete('/knowledge/chunks/{chunk_id_str}')
def delete_knowledge_chunk(chunk_id_str: str, db: Session = Depends(get_db)):
    chunk = db.query(KnowledgeChunk).filter(KnowledgeChunk.chunk_id == chunk_id_str).first()
    if chunk:
        db.delete(chunk)
        db.commit()
    try:
        vector_store.delete([chunk_id_str])
    except Exception:
        pass
    return {'message': 'ok'}

@router.get('/knowledge/stats')
def knowledge_stats(db: Session = Depends(get_db)):
    total = db.query(KnowledgeChunk).count()
    source_counts = db.query(KnowledgeChunk.source, sqlfunc.count(KnowledgeChunk.id)).group_by(KnowledgeChunk.source).all()
    return {'total_chunks': total, 'sources': [{'source': s, 'count': c} for s, c in source_counts]}

# ===== Tags =====
@router.get('/tags', response_model=list[TagResponse])
def list_tags(category: str = '', db: Session = Depends(get_db)):
    q = db.query(Tag)
    if category:
        q = q.filter(Tag.category == category)
    return q.all()

@router.post('/tags', response_model=TagResponse)
def create_tag(data: TagCreate, db: Session = Depends(get_db)):
    tag = Tag(**data.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag

@router.delete('/tags/{tag_id}')
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(404)
    db.delete(tag)
    db.commit()
    return {'message': 'ok'}

# ===== Knowledge Gap Detection =====
@router.get('/knowledge-gaps')
def knowledge_gaps(db: Session = Depends(get_db)):
    low_score = db.query(Conversation).filter(Conversation.score <= 2, Conversation.status == 'pending').all()
    items = [(c.id, c.user_input) for c in low_score]
    clusters = semantic_cluster(items) if items else []
    if clusters is None:
        # embedding 不可用，降级到前缀匹配（保持旧行为）
        topics = {}
        for c in low_score:
            w = c.user_input[:20]
            topics[w] = topics.get(w, 0) + 1
        clusters = [{'topic': t, 'frequency': f, 'example_inputs': [], 'conv_ids': []}
                    for t, f in sorted(topics.items(), key=lambda x: -x[1])[:10]]
    # 回填每个话题的处理状态（话题维度的闭环标记，不依赖落库的聚类）
    status_map = {}
    try:
        from app.services.knowledge_gap import topic_key
        for c in db.query(KnowledgeGapStatus).all():
            status_map[c.topic_key] = c
        for g in clusters:
            tk = topic_key(g.get('topic', ''))
            st = status_map.get(tk)
            g['status'] = st.status if st else 'open'
            g['gap_note'] = st.note if st else ''
            g['topic_key'] = tk
    except Exception:
        for g in clusters:
            g['status'] = g.get('status', 'open')
            g['gap_note'] = g.get('gap_note', '')
            g['topic_key'] = ''
    return {'gaps': clusters, 'total_low_score': len(low_score)}


@router.post('/knowledge-gaps/{topic_key}/status')
def update_knowledge_gap_status(topic_key: str, payload: GapStatusUpdate, db: Session = Depends(get_db)):
    import datetime
    st = db.query(KnowledgeGapStatus).filter(KnowledgeGapStatus.topic_key == topic_key).first()
    if not st:
        st = KnowledgeGapStatus(topic_key=topic_key)
        db.add(st)
    st.topic = (payload.topic or '')[:255]
    st.status = payload.status or 'open'
    st.note = payload.note or ''
    st.handled_at = datetime.datetime.utcnow() if st.status != 'open' else None
    db.commit()
    db.refresh(st)
    return {'message': 'ok', 'status': st.status}

# ===== Statistics Dashboard =====
@router.get('/stats')
def stylist_stats(db: Session = Depends(get_db)):
    total = db.query(Conversation).count()
    avg_row = db.query(sqlfunc.avg(Conversation.score)).filter(Conversation.score > 0).scalar()
    avg_score = round(avg_row, 2) if avg_row else 0
    failed = db.query(Conversation).filter(Conversation.score <= 2, Conversation.score > 0).count()
    # 「我的提交」只算真正修好的（fixed/approved/deployed），rejected 是被配置端驳回，
    # 不应计入成功修正数——否则会把被驳回的也当成功，跟配置端审核口径不一致。
    fixed = db.query(Correction).filter(Correction.status.in_(['fixed', 'approved', 'deployed'])).count()
    published = db.query(Correction).filter(Correction.status == 'deployed').count()

    rating_rows = db.query(Conversation.score, sqlfunc.count(Conversation.id)).filter(Conversation.score > 0).group_by(Conversation.score).all()
    rating_dist = {str(i): 0 for i in range(1, 6)}
    for s, c in rating_rows:
        rating_dist[str(int(s))] = c

    error_rows = db.query(Correction.error_type, sqlfunc.count(Correction.id)).group_by(Correction.error_type).all()
    error_dist = {k: 0 for k in ['style', 'occasion', 'color', 'size', 'other']}
    for et, c in error_rows:
        if et in error_dist:
            error_dist[et] = c

    today = datetime.now().date()
    start = today - timedelta(days=6)
    trend_rows = db.query(
        sqlfunc.strftime('%m-%d', Conversation.created_at),
        sqlfunc.count(Conversation.id)
    ).filter(Conversation.created_at >= str(start)).group_by(sqlfunc.strftime('%m-%d', Conversation.created_at)).all()
    trend_map = {d: c for d, c in trend_rows}
    trend_7d = []
    for i in range(7):
        label = (start + timedelta(days=i)).strftime('%m-%d')
        trend_7d.append({'date': label, 'count': trend_map.get(label, 0)})

    return {
        'total': total,
        'avg_score': avg_score,
        'failed': failed,
        'fixed': fixed,
        'published': published,
        'rating_dist': rating_dist,
        'error_dist': error_dist,
        'trend_7d': trend_7d
    }


# ===== FR-A3 单品纠错（item 维度，形成反馈数据集）=====
@router.get('/item-corrections')
def list_item_corrections(status: str = '', page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    from app.models.item_correction import ClothingItemCorrection
    from app.models.wardrobe import ClothingItem
    q = db.query(ClothingItemCorrection)
    if status:
        q = q.filter(ClothingItemCorrection.status == status)
    q = q.order_by(ClothingItemCorrection.id.asc())
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    items = {i.id: i for i in db.query(ClothingItem).all()}
    out = []
    for r in rows:
        it = items.get(r.item_id)
        out.append({
            'id': r.id, 'item_id': r.item_id, 'user_id': r.user_id,
            'item_name': it.name if it else '', 'item_image': it.image_url if it else '',
            'error_fields': json.loads(r.error_fields or '[]'),
            'correct_attrs': json.loads(r.correct_attrs or '{}'),
            'note': r.note, 'status': r.status,
            'created_at': str(r.created_at) if r.created_at else None,
        })
    return {'total': total, 'list': out}


@router.post('/item-corrections')
def create_item_correction(payload: ItemCorrectionCreate, db: Session = Depends(get_db)):
    from app.models.item_correction import ClothingItemCorrection
    from app.models.wardrobe import ClothingItem
    it = db.query(ClothingItem).filter(ClothingItem.id == payload.item_id).first()
    if not it:
        raise HTTPException(404, '单品不存在')
    corr = ClothingItemCorrection(
        item_id=payload.item_id, user_id=it.user_id,
        error_fields=json.dumps(payload.error_fields, ensure_ascii=False),
        correct_attrs=json.dumps(payload.correct_attrs, ensure_ascii=False),
        note=payload.note, status='pending')
    db.add(corr)
    db.commit()
    db.refresh(corr)
    return {'id': corr.id, 'item_id': corr.item_id, 'status': corr.status}


@router.post('/item-corrections/{corr_id}/apply')
def apply_item_correction(corr_id: int, db: Session = Depends(get_db)):
    from app.models.item_correction import ClothingItemCorrection
    from app.models.wardrobe import ClothingItem
    corr = db.query(ClothingItemCorrection).filter(ClothingItemCorrection.id == corr_id).first()
    if not corr:
        raise HTTPException(404, '纠错记录不存在')
    item = db.query(ClothingItem).filter(ClothingItem.id == corr.item_id).first()
    if not item:
        raise HTTPException(404, '单品不存在')
    attrs = json.loads(corr.correct_attrs or '{}')
    allowed = {'name', 'category', 'color', 'style', 'material', 'pattern', 'season', 'occasion'}
    for k, v in attrs.items():
        if k in allowed and v:
            setattr(item, k, str(v))
    corr.status = 'applied'
    db.commit()
    return {'message': '已应用修正', 'item_id': item.id, 'attrs': attrs}


@router.post('/item-corrections/{corr_id}/reject')
def reject_item_correction(corr_id: int, db: Session = Depends(get_db)):
    from app.models.item_correction import ClothingItemCorrection
    corr = db.query(ClothingItemCorrection).filter(ClothingItemCorrection.id == corr_id).first()
    if not corr:
        raise HTTPException(404, '纠错记录不存在')
    corr.status = 'rejected'
    db.commit()
    return {'message': '已驳回'}


