from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from . import Base


class ClothingItemCorrection(Base):
    """衣橱单品 AI 识别纠错（FR-A3 item 维度）：运营端修正错误属性，形成反馈数据集。"""
    __tablename__ = "item_corrections"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("clothing_items.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stylist_id = Column(Integer, default=0)
    error_fields = Column(Text, default="[]")     # JSON: 出错的字段名列表，如 ["category","color"]
    correct_attrs = Column(Text, default="{}")    # JSON: 修正后的属性，如 {"category":"bottom","color":"深灰"}
    note = Column(Text, default="")
    status = Column(String, default="pending")    # pending / applied / rejected
    created_at = Column(DateTime, server_default=func.now())
