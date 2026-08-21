from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from . import Base


class AdoptionRecord(Base):
    """采纳记录 / 穿搭日志（FR-C7）：用户采纳某套搭配时落一条，含单品快照与推荐理由。

    驱动指标：采纳率 = 采纳数 / 推荐次数；穿搭日志 = 按日期回顾。
    """
    __tablename__ = "adoption_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    source = Column(String, default="chat")        # today / chat / scene / manual
    scene = Column(String, default="")             # 通勤/约会/运动/婚礼...
    conversation_id = Column(Integer, default=0)
    item_ids = Column(Text, default="[]")          # JSON [item_id, ...]
    reason = Column(Text, default="")              # 采纳时的推荐理由/备注
    adopted_date = Column(Date, nullable=False)    # 采纳日期（可回溯）
    created_at = Column(DateTime, server_default=func.now())
