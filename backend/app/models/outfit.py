from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from . import Base


class Outfit(Base):
    """用户自定义套装（FR-C2）。item_ids 存 JSON 数组。"""
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, default="我的套装")
    item_ids = Column(Text, default="[]")  # JSON [item_id, ...]
    description = Column(String, default="")
    cover_url = Column(Text, default="")   # 拼贴封面图
    created_at = Column(DateTime, server_default=func.now())
