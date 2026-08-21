"""管理端 API（FR-A1 数据仪表盘 / FR-A2 用户管理），仅 admin 可访问。"""
import json
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.models import get_db
from app.models.user import User
from app.models.wardrobe import ClothingItem, WearLog
from app.models.conversation import Conversation
from app.models.cost import CostLog
from app.models.adoption import AdoptionRecord
from app.auth.permissions import require_roles
from app.schemas import AdminUserDisable

router = APIRouter(prefix='/api/admin', tags=['admin'],
                   dependencies=[Depends(require_roles('admin'))])


# ===================== FR-A2 用户管理 =====================
@router.get('/users')
def list_users(search: str = '', role: str = '', page: int = 1, page_size: int = 20,
               db: Session = Depends(get_db)):
    q = db.query(User)
    if search:
        like = f'%{search}%'
        q = q.filter((User.username.like(like)) | (User.nickname.like(like)))
    # 只有显式传 role 时才按角色筛选，默认展示全部账号
    if role:
        q = q.filter(User.role == role)
    total = q.count()
    rows = q.order_by(User.id.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        'total': total,
        'users': [{
            'id': u.id, 'username': u.username, 'nickname': u.nickname, 'role': u.role,
            'is_active': bool(getattr(u, 'is_active', True)),
            'city': u.city or '',
            'last_login_city': u.last_login_city or '',
            'last_login_at': str(u.last_login_at) if u.last_login_at else None,
            'created_at': str(u.created_at) if u.created_at else None,
        } for u in rows],
    }


@router.get('/users/{user_id}/wardrobe')
def user_wardrobe(user_id: int, db: Session = Depends(get_db)):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == user_id).all()
    return {'user_id': user_id, 'count': len(items),
            'items': [{'id': i.id, 'name': i.name, 'category': i.category, 'color': i.color or '',
                       'style': i.style or '', 'image_url': i.image_url or '',
                       'wear_count': i.wear_count or 0, 'status': i.status} for i in items]}


@router.post('/users/disable')
def disable_user(data: AdminUserDisable, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(404, '用户不存在')
    if user.role == 'admin':
        raise HTTPException(400, '不能禁用管理员账号')
    user.is_active = 0 if data.disable else 1
    db.commit()
    return {'message': '已禁用' if data.disable else '已恢复', 'user_id': user.id,
            'is_active': bool(user.is_active)}


# ===================== FR-A1 数据仪表盘 =====================
@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    week_ago = datetime.now() - timedelta(days=7)
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(User).filter(User.role == 'user').count()
    total_recommendations = db.query(Conversation).count()
    total_adoptions = db.query(AdoptionRecord).count()
    adoption_rate = round(total_adoptions / total_recommendations, 4) if total_recommendations else 0

    active_users_7d = db.query(sqlfunc.count(sqlfunc.distinct(Conversation.user_id))).filter(
        Conversation.created_at >= week_ago).scalar() or 0

    tryon_usage = 0  # 虚拟试穿暂未上线（占位指标）

    cost_row = db.query(
        sqlfunc.count(CostLog.id), sqlfunc.sum(CostLog.cost)
    ).filter(CostLog.created_at >= month_start).first()
    month_cost = round(float(cost_row[1] or 0), 4) if cost_row else 0

    # 近 7 日每日推荐数
    d0 = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
    daily_rows = db.query(
        sqlfunc.date(Conversation.created_at), sqlfunc.count(Conversation.id)
    ).filter(Conversation.created_at >= d0).group_by(sqlfunc.date(Conversation.created_at)).all()
    daily_map = {str(d): c for d, c in daily_rows}
    daily = []
    for i in range(7):
        day = (d0 + timedelta(days=i)).strftime('%Y-%m-%d')
        daily.append({'date': day, 'count': daily_map.get(day, 0)})

    # 采纳来源分布
    src_rows = db.query(AdoptionRecord.source, sqlfunc.count(AdoptionRecord.id)).group_by(
        AdoptionRecord.source).all()
    adoption_by_source = {s: c for s, c in src_rows}

    return {
        'total_users': total_users,
        'total_recommendations': total_recommendations,
        'total_adoptions': total_adoptions,
        'adoption_rate': adoption_rate,
        'active_users_7d': active_users_7d,
        'virtual_tryon_usage': tryon_usage,
        'month_cost': month_cost,
        'daily_recommendations': daily,
        'adoption_by_source': adoption_by_source,
    }
