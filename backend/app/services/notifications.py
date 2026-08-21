# 通知中心：统一的通知写入入口
from app.models import SessionLocal
from app.models.notification import Notification


def create_notification(
    db,
    user_id: int,
    ntype: str,
    title: str,
    content: str,
    image_url: str = "",
    payload: dict = None,
):
    """
    写入一条通知。payload 暂未落库（保留扩展位），当前只存文本+图片。
    返回 Notification 对象。
    """
    n = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        content=content,
        image_url=image_url or "",
        is_read=False,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
