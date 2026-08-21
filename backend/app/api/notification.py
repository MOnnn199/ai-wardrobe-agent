from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List

from datetime import date

from app.models import get_db
from app.models.notification import Notification
from app.schemas import NotificationResponse
from app.services import scheduled
from app.api.user import resolve_user_id

router = APIRouter(prefix='/api/user', tags=['notification'])


def _ensure_monthly_notifications(db, user_id: int):
    """若当前用户本月还没有月报/热点通知，自动生成一份，保证新用户也能看到。"""
    this_month = date.today().strftime('%Y-%m')
    has_monthly = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == 'monthly_report',
        Notification.title == f'{this_month} 衣橱健康月报'
    ).first()
    has_trend = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == 'trend_push',
        Notification.title == f'{this_month} 穿搭热点推送'
    ).first()
    if not has_monthly:
        try:
            scheduled.run_monthly_report(user_id)
        except Exception:
            pass
    if not has_trend:
        try:
            scheduled.run_trend_push(user_id)
        except Exception:
            pass


@router.get('/notifications', response_model=List[NotificationResponse])
def list_notifications(
    user_id: int = Depends(resolve_user_id),
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    _ensure_monthly_notifications(db, user_id)
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get('/notifications/unread-count')
def unread_count(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).count()
    return {'count': n}


@router.post('/notifications/{nid}/read')
def mark_read(nid: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == nid, Notification.user_id == user_id
    ).first()
    if not n:
        return {'ok': False}
    n.is_read = True
    db.commit()
    return {'ok': True}


@router.post('/notifications/read-all')
def mark_all_read(user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).update({Notification.is_read: True})
    db.commit()
    return {'ok': True}


@router.delete('/notifications/{nid}')
def delete_notification(nid: int, user_id: int = Depends(resolve_user_id), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == nid, Notification.user_id == user_id
    ).first()
    if n:
        db.delete(n)
        db.commit()
    return {'ok': True}


@router.post('/notifications/trigger')
def trigger_notifications(job: str = 'daily', user_id: int = 1, db: Session = Depends(get_db)):
    """
    手动触发推送（用于演示/测试，无需等待 cron）。
    job: monthly / idle(同 monthly) / trend / all
    注：今日穿搭不写通知，由首页实时展示，job='daily' 不再生成通知。
    """
    from app.services import scheduled
    if job == 'daily':
        return {'ok': False, 'msg': '今日穿搭在首页实时展示，不写入通知中心'}
    elif job == 'monthly':
        scheduled.run_monthly_report(user_id)
    elif job == 'trend':
        scheduled.run_trend_push(user_id)
    elif job == 'all':
        scheduled.run_monthly_report(user_id)
        scheduled.run_trend_push(user_id)
    else:
        return {'ok': False, 'msg': 'unknown job'}
    return {'ok': True, 'job': job}
