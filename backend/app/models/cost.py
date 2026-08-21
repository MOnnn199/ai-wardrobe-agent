from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from . import Base


class CostLog(Base):
    """AI 调用成本日志：每次 LLM / 图片处理调用记录 token 消耗与成本，用于运营端成本监控。"""

    __tablename__ = "cost_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=0)            # 0 表示系统级调用（如热点生成）
    call_type = Column(String, default="llm")       # llm / image
    model = Column(String, default="")              # 模型名，如 deepseek-chat / remove.bg
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    cost = Column(Float, default=0.0)               # 人民币（元）
    created_at = Column(DateTime, server_default=func.now())
