"""P1 新增用户端 API：自定义套装 / 场景快捷推荐 / 采纳链路与穿搭日志 / 日程表 / 个人设置。"""
import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import get_db
from app.models.user import User
from app.models.wardrobe import ClothingItem, WearLog
from app.models.conversation import Conversation
from app.models.outfit import Outfit
from app.models.calendar import CalendarEvent
from app.models.adoption import AdoptionRecord
from app.schemas import (
    OutfitCreate, OutfitUpdate, OutfitResponse,
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse,
    AdoptionCreate, AdoptionResponse,
    UserProfileUpdate, SceneRecommendRequest,
)
from app.api.user import resolve_user_id
from app.utils.outfit_collage import _render_collage

router = APIRouter(prefix='/api/user', tags=['user-features'])

CAT_CN = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰',
          'outer': '外套', 'dress': '连衣裙'}

# ===================== 场景快捷推荐（FR-C4）=====================
SCENES = {
    'commute':  {'label': '通勤', 'prompt': '通勤上班，需要得体舒适、方便活动的搭配'},
    'date':     {'label': '约会', 'prompt': '约会，需要精致有气质、给人好印象的搭配'},
    'sport':    {'label': '运动', 'prompt': '运动健身，需要透气舒适、适合活动的搭配'},
    'wedding':  {'label': '婚礼', 'prompt': '参加婚礼，需要正式得体、有仪式感的搭配'},
    'party':    {'label': '聚会', 'prompt': '朋友聚会/派对，需要时尚亮眼、有风格的搭配'},
    'travel':   {'label': '出行', 'prompt': '外出旅行，需要舒适耐穿、方便拍照出片的搭配'},
    'interview':{'label': '面试', 'prompt': '面试，需要稳重专业、给人可信赖感的搭配'},
}


def _user_location(user: User) -> dict:
    return {'city': user.city or '', 'lat': user.lat, 'lon': user.lon}


@router.get('/scenes')
def list_scenes():
    return [{'key': k, 'label': v['label'], 'prompt': v['prompt']} for k, v in SCENES.items()]


@router.post('/quick-recommend')
def quick_recommend(data: SceneRecommendRequest = None, scene: str = 'commute',
                    note: str = '', user_id: int = Depends(resolve_user_id),
                    db: Session = Depends(get_db)):
    """场景一键推荐：按场景模板 + 衣橱 + 天气跑 agent，返回推荐文本、命中的单品与拼贴图。"""
    body = data
    if body is not None:
        scene = body.scene
        note = body.note or ''
    if scene not in SCENES:
        raise HTTPException(400, f'未知场景：{scene}，可选 {", ".join(SCENES.keys())}')
    meta = SCENES[scene]
    user = db.query(User).filter(User.id == user_id).first()
    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id, ClothingItem.status == 'confirmed').all()
    if not items:
        return {'recommendation': '你的衣橱还没有衣物，先去「衣橱」添加吧！', 'items': [], 'outfit_image': None,
                'conversation_id': None}

    from app.agent.init_tools import tool_registry
    from app.agent.react_agent import ReActAgent
    item_desc = json.dumps([{
        'name': i.name, 'category': i.category, 'color': i.color, 'style': i.style,
        'season': i.season, 'occasion': i.occasion,
    } for i in items], ensure_ascii=False)
    prompt = (
        f'用户需要【{meta["label"]}】场景的穿搭：{meta["prompt"]}。'
        f'{("补充需求：" + note + "。") if note else ""}'
        f'我的衣橱里有这些衣服：{item_desc}。请结合天气与场合，从我的衣橱里挑选单品，'
        f'推荐 2-3 套具体可穿的方案，每套列出用到的单品名称与推荐理由。'
    )
    # 优先使用前端传来的实时定位，否则回退到用户资料里的城市/坐标
    loc_city = (body.city if body else None) or user.city or ''
    loc_lat = (body.lat if body else None) if (body and body.lat is not None) else user.lat
    loc_lon = (body.lon if body else None) if (body and body.lon is not None) else user.lon
    agent = ReActAgent(tool_registry)
    result = agent.run(prompt, user_id=user_id,
                       city=loc_city, lat=loc_lat, lon=loc_lon)

    conv = Conversation(user_id=user_id, user_input=f'【{meta["label"]}】{note or meta["prompt"]}',
                        agent_response=result)
    db.add(conv)
    db.commit()

    outfit_image = None
    try:
        outfit_image = _render_collage(items, f'scene_{scene}_{user_id}', meta['label'],
                                       'http://localhost:8000')
    except Exception as e:
        print('quick recommend collage failed:', e)

    return {'recommendation': result, 'conversation_id': conv.id,
            'outfit_image': outfit_image, 'scene': scene}


# ===================== 自定义套装（FR-C2）=====================
@router.get('/outfits', response_model=list[OutfitResponse])
def list_outfits(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    return db.query(Outfit).filter(Outfit.user_id == user_id).order_by(Outfit.created_at.desc()).all()


@router.post('/outfits', response_model=OutfitResponse)
def create_outfit(data: OutfitCreate, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    if len(data.item_ids) < 1:
        raise HTTPException(400, '套装至少需要 1 件衣物')
    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == user_id, ClothingItem.id.in_(data.item_ids)).all()
    if not items:
        raise HTTPException(400, '选中的衣物无效')
    outfit = Outfit(user_id=user_id, name=data.name, item_ids=json.dumps(data.item_ids),
                    description=data.description)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    try:
        cover = _render_collage(items, f'outfit_{outfit.id}', data.name, 'http://localhost:8000')
        if cover:
            outfit.cover_url = cover
            db.commit()
    except Exception as e:
        print('outfit cover failed:', e)
    return outfit


@router.put('/outfits/{outfit_id}', response_model=OutfitResponse)
def update_outfit(outfit_id: int, data: OutfitUpdate, user_id: int = Depends(resolve_user_id),
                  db: Session = Depends(get_db)):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == user_id).first()
    if not outfit:
        raise HTTPException(404, '套装不存在')
    if data.name is not None:
        outfit.name = data.name
    if data.item_ids is not None:
        outfit.item_ids = json.dumps(data.item_ids)
    if data.description is not None:
        outfit.description = data.description
    db.commit()
    db.refresh(outfit)
    return outfit


@router.delete('/outfits/{outfit_id}')
def delete_outfit(outfit_id: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == user_id).first()
    if not outfit:
        raise HTTPException(404, '套装不存在')
    db.delete(outfit)
    db.commit()
    return {'message': 'ok'}


# ===================== 采纳链路 + 穿搭日志（FR-C7）=====================
@router.post('/outfits/adopt', response_model=AdoptionResponse)
def adopt_outfit(data: AdoptionCreate, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    """用户采纳一套搭配：记录采纳 + 给单品写穿着记录（驱动 wear_count/last_worn）。"""
    adopted_date = date.today()
    if data.adopted_date:
        try:
            adopted_date = date.fromisoformat(str(data.adopted_date)[:10])
        except Exception:
            adopted_date = date.today()

    if data.item_ids:
        items = db.query(ClothingItem).filter(
            ClothingItem.user_id == user_id, ClothingItem.id.in_(data.item_ids)).all()
        if not items:
            raise HTTPException(400, '选中的衣物无效')
        for it in items:
            exists = db.query(WearLog).filter(
                WearLog.item_id == it.id, WearLog.user_id == user_id,
                WearLog.worn_date == adopted_date).first()
            if not exists:
                db.add(WearLog(user_id=user_id, item_id=it.id, worn_date=adopted_date))
                it.wear_count = (it.wear_count or 0) + 1
            if (it.last_worn is None) or (adopted_date > it.last_worn):
                it.last_worn = adopted_date

    record = AdoptionRecord(
        user_id=user_id, source=data.source, scene=data.scene,
        conversation_id=data.conversation_id,
        item_ids=json.dumps(data.item_ids),
        reason=data.reason, adopted_date=adopted_date)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get('/adoptions', response_model=list[AdoptionResponse])
def list_adoptions(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    return db.query(AdoptionRecord).filter(AdoptionRecord.user_id == user_id)\
        .order_by(AdoptionRecord.adopted_date.desc(), AdoptionRecord.id.desc()).limit(100).all()


@router.get('/wear-diary')
def wear_diary(month: str = '', user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    """穿搭日志：按日期聚合（采纳的搭配 + 当天穿过的单品），附统计。"""
    # 采纳记录（按日期）
    adoptions = db.query(AdoptionRecord).filter(AdoptionRecord.user_id == user_id)\
        .order_by(AdoptionRecord.adopted_date.desc()).all()
    if month:
        adoptions = [a for a in adoptions if str(a.adopted_date).startswith(month)]
    # 穿着记录（按日期）
    wear_rows = db.query(WearLog.worn_date, WearLog.item_id).filter(WearLog.user_id == user_id).all()
    if month:
        wear_rows = [w for w in wear_rows if str(w[0]).startswith(month)]
    items_by_id = {i.id: i for i in db.query(ClothingItem).filter(ClothingItem.user_id == user_id).all()}

    days: dict[str, dict] = {}
    for a in adoptions:
        key = str(a.adopted_date)
        day = days.setdefault(key, {'date': key, 'adoptions': [], 'items': [], 'item_ids': set()})
        ids = json.loads(a.item_ids or '[]')
        day['adoptions'].append({
            'id': a.id, 'source': a.source, 'scene': a.scene,
            'reason': a.reason, 'item_ids': ids,
        })
        for iid in ids:
            day['item_ids'].add(iid)
    for wdate, iid in wear_rows:
        key = str(wdate)
        day = days.setdefault(key, {'date': key, 'adoptions': [], 'items': [], 'item_ids': set()})
        day['item_ids'].add(iid)
    for day in days.values():
        day['items'] = [
            {'id': i.id, 'name': i.name, 'category': i.category, 'color': i.color or '',
             'image_url': i.image_url or ''}
            for i in (items_by_id.get(x) for x in sorted(day['item_ids']))
            if i is not None
        ]
        day.pop('item_ids', None)

    days_list = sorted(days.values(), key=lambda d: d['date'], reverse=True)
    total_adoptions = len(adoptions)
    total_items = sum(len(d.get('items', [])) for d in days_list)
    return {'days': days_list, 'stats': {'total_adoptions': total_adoptions,
                                         'total_worn_records': total_items,
                                         'days_active': len(days_list)}}


# ===================== 应用内日程表（FR-C6 日程联动）=====================
@router.get('/calendar', response_model=list[CalendarEventResponse])
def list_calendar(start: str = '', end: str = '',
                  user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    q = db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id)
    if start:
        q = q.filter(CalendarEvent.event_date >= start)
    if end:
        q = q.filter(CalendarEvent.event_date <= end)
    return q.order_by(CalendarEvent.event_date.asc()).all()


@router.post('/calendar', response_model=CalendarEventResponse)
def create_calendar_event(data: CalendarEventCreate, user_id: int = Depends(resolve_user_id),
                          db: Session = Depends(get_db)):
    try:
        ev_date = date.fromisoformat(str(data.event_date)[:10])
    except Exception:
        raise HTTPException(400, 'event_date 格式应为 YYYY-MM-DD')
    ev = CalendarEvent(user_id=user_id, title=data.title, event_date=ev_date,
                       start_time=data.start_time, end_time=data.end_time,
                       occasion=data.occasion, location=data.location,
                       note=data.note, remind=data.remind)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.put('/calendar/{event_id}', response_model=CalendarEventResponse)
def update_calendar_event(event_id: int, data: CalendarEventUpdate,
                          user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id,
                                        CalendarEvent.user_id == user_id).first()
    if not ev:
        raise HTTPException(404, '日程不存在')
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == 'event_date' and v:
            try:
                v = date.fromisoformat(str(v)[:10])
            except Exception:
                raise HTTPException(400, 'event_date 格式应为 YYYY-MM-DD')
        setattr(ev, k, v)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete('/calendar/{event_id}')
def delete_calendar_event(event_id: int, user_id: int = Depends(resolve_user_id),
                          db: Session = Depends(get_db)):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id,
                                        CalendarEvent.user_id == user_id).first()
    if not ev:
        raise HTTPException(404, '日程不存在')
    db.delete(ev)
    db.commit()
    return {'message': 'ok'}


# ===================== 个人设置（定位用于天气提醒/场景推荐）=====================
@router.get('/profile')
def get_profile(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return {'id': user.id, 'username': user.username, 'nickname': user.nickname,
            'city': user.city or '', 'lat': user.lat, 'lon': user.lon,
            'height': user.height, 'weight': user.weight,
            'skin_tone': user.skin_tone or '', 'body_type': user.body_type or '',
            'style_preference': user.style_preference or ''}


@router.put('/profile')
def update_profile(data: UserProfileUpdate, user_id: int = Depends(resolve_user_id),
                   db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    return {'message': 'ok',
            'nickname': user.nickname, 'username': user.username,
            'city': user.city, 'lat': user.lat, 'lon': user.lon,
            'height': user.height, 'weight': user.weight,
            'skin_tone': user.skin_tone, 'body_type': user.body_type,
            'style_preference': user.style_preference}
