"""P1 新增用户端 API：自定义套装 / 场景快捷推荐 / 个人设置。

已移除（按产品决策不再提供用户端入口，故随代码一并清理）：
- 采纳链路与穿搭日志（FR-C7）：穿搭回顾改由 /user/wardrobe/wear-by-date 查 WearLog 驱动
- 应用内日程表（FR-C6）：用户端无日程入口
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models import get_db
from app.models.user import User
from app.models.wardrobe import ClothingItem
from app.models.conversation import Conversation
from app.models.outfit import Outfit
from app.schemas import (
    OutfitCreate, OutfitUpdate, OutfitResponse,
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


# 场景推荐：每个场景适合的款式/颜色关键词（用于给单品打分）
_SCENE_PREFERENCES = {
    'commute':  {'styles': ['简约', '通勤', '商务', '休闲', '基础'], 'colors': ['黑', '白', '灰', '蓝', '米', '驼', '藏青']},
    'date':     {'styles': ['优雅', '精致', '温柔', '浪漫', '气质'], 'colors': ['粉', '白', '米', '红', '黑', '蓝']},
    'sport':    {'styles': ['运动', '休闲', '舒适', '透气'], 'colors': ['黑', '白', '灰', '蓝', '绿']},
    'wedding':  {'styles': ['正式', '优雅', '礼服', '端庄'], 'colors': ['黑', '白', '米', '粉', '红', '藏青']},
    'party':    {'styles': ['时尚', '亮眼', '个性', '酷'], 'colors': ['黑', '红', '金', '银', '白']},
    'travel':   {'styles': ['舒适', '休闲', '百搭', '轻便'], 'colors': ['白', '米', '蓝', '黑', '卡其']},
    'interview':{'styles': ['正式', '商务', '专业', '稳重', '简约'], 'colors': ['黑', '白', '灰', '藏青', '蓝', '米']},
}


def _score_item_for_scene(item: ClothingItem, scene: str) -> int:
    """按场景给单品打适合分，分数越高越适合。"""
    prefs = _SCENE_PREFERENCES.get(scene, _SCENE_PREFERENCES['commute'])
    score = 0
    text = f"{item.name or ''} {item.style or ''} {item.color or ''} {item.occasion or ''}"
    text_lo = text.lower()
    for kw in prefs['styles']:
        if kw in text_lo: score += 3
    for kw in prefs['colors']:
        if kw in text_lo: score += 2
    # 面试/婚礼等正式场合，贬抑过于休闲或童趣的元素
    if scene in ('interview', 'wedding'):
        casual_kws = ['卡通', '可爱', '短裤', '拖鞋', '运动', '睡衣', '居家']
        for kw in casual_kws:
            if kw in text_lo: score -= 5
    return score


def _pick_outfit_items(items: list[ClothingItem], scene: str) -> list[ClothingItem]:
    """从衣橱中精选一套搭配：每品类最多一件，连衣裙可替代上装+下装。"""
    by_cat: dict[str, list[ClothingItem]] = {}
    for it in items:
        by_cat.setdefault(it.category, []).append(it)
    # 按场景适合度排序
    for cat in by_cat:
        by_cat[cat].sort(key=lambda x: _score_item_for_scene(x, scene), reverse=True)

    picked: list[ClothingItem] = []
    used_cats = set()

    # 核心：连衣裙 or 上装+下装
    if 'dress' in by_cat and by_cat['dress']:
        picked.append(by_cat['dress'][0])
        used_cats.update(['dress'])
    else:
        if 'top' in by_cat and by_cat['top']:
            picked.append(by_cat['top'][0])
            used_cats.add('top')
        if 'bottom' in by_cat and by_cat['bottom']:
            picked.append(by_cat['bottom'][0])
            used_cats.add('bottom')

    # 可选补充：外套、鞋子、配饰（每类最多一件，且按场景排序后取最搭）
    for cat in ['outer', 'shoes', 'accessory']:
        if cat in by_cat and cat not in used_cats:
            # 在已有 picked 基础上，选颜色/风格最协调的；简单做法：取该类场景分最高者
            picked.append(by_cat[cat][0])
            used_cats.add(cat)

    return picked[:5]  # 最多 5 件，避免过多


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

    # 先程序化精选一套搭配（每品类一件），再让 AI 为这套搭配写推荐理由
    picked = _pick_outfit_items(items, scene)
    picked_desc = json.dumps([{
        'id': i.id, 'name': i.name, 'category': i.category, 'color': i.color, 'style': i.style,
        'season': i.season, 'occasion': i.occasion,
    } for i in picked], ensure_ascii=False)
    all_desc = json.dumps([{
        'name': i.name, 'category': i.category, 'color': i.color, 'style': i.style,
        'season': i.season, 'occasion': i.occasion,
    } for i in items], ensure_ascii=False)
    prompt = (
        f'用户需要【{meta["label"]}】场景的穿搭：{meta["prompt"]}。'
        f'{("补充需求：" + note + "。") if note else ""}'
        f'我已经从他的衣橱里精选了这套搭配：{picked_desc}。'
        f'完整衣橱：{all_desc}。'
        f'请结合天气与场合，仅围绕这套精选搭配写一段推荐语：说明每件单品在整体中的作用、为什么这样搭、以及适合 {meta["label"]} 场合。'
        f'不要推荐其他备选方案，只讲这一套。'
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
        outfit_image = _render_collage(picked, f'scene_{scene}_{user_id}', meta['label'],
                                       'http://localhost:8000')
    except Exception as e:
        print('quick recommend collage failed:', e)

    return {'recommendation': result, 'conversation_id': conv.id,
            'outfit_image': outfit_image, 'scene': scene,
            'item_ids': [i.id for i in picked]}


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
