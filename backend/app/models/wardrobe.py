from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from . import Base

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    category = Column(String)  # top / bottom / shoes / accessory
    color = Column(String)
    style = Column(String, default="")  # old money / y2k / ...
    material = Column(String, default="")  # 材质：棉/麻/丝/牛仔/聚酯...
    pattern = Column(String, default="")  # 图案：纯色/条纹/格纹/碎花...
    season = Column(String, default="")  # spring / summer / ...
    occasion = Column(String, default="")  # formal / casual / ...
    image_url = Column(Text, default="")
    status = Column(String, default="confirmed")  # confirmed / pending / returned
    tags = Column(Text, default="[]")  # JSON 列表，存标签 name（来自线上 tags 表）
    # ===== 时间维度字段（用于闲置 / 淘汰分析）=====
    purchase_date = Column(Date, nullable=True)  # 购入日期
    last_worn = Column(Date, nullable=True)       # 最后穿着日期（None=未记录穿过）
    wear_count = Column(Integer, default=0)        # 穿着次数
    created_at = Column(DateTime, server_default=func.now())


class WearLog(Base):
    """穿着记录：每次穿着按日期落一条，用于识别「哪一天穿了哪件」并驱动闲置天数。"""
    __tablename__ = "wear_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_id = Column(Integer, ForeignKey("clothing_items.id"))
    worn_date = Column(Date, nullable=False)         # 穿着日期（可回溯历史）
    created_at = Column(DateTime, server_default=func.now())
