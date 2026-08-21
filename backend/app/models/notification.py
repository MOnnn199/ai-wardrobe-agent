from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from . import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    # 类型：daily_push / monthly_report / idle_reminder / duplicate_purchase / trend_push / system
    type = Column(String, default="system")
    title = Column(String, default="")
    content = Column(Text, default="")
    image_url = Column(Text, default="")      # 可选：搭配图等
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
