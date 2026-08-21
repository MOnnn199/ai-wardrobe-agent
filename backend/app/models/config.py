from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from . import Base

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    content = Column(Text)
    status = Column(String, default="draft")  # draft / online / history
    created_at = Column(DateTime, server_default=func.now())
    deployed_at = Column(DateTime, nullable=True)


class ToolConfig(Base):
    """工具开关的持久化配置：重启后端后也能恢复 enabled 状态。"""
    __tablename__ = "tool_configs"

    tool_name = Column(String, primary_key=True)        # 与 tool_registry 中的 name 对应
    enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
