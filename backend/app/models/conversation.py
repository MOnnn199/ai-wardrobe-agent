from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from . import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_input = Column(Text)
    agent_response = Column(Text)
    score = Column(Integer, default=0)
    feedback = Column(Text, default="")
    status = Column(String, default="normal")  # normal / pending / fixed / approved / deployed
    user_image_url = Column(Text)  # 用户上传的图片地址（聊天中用图片提问时）
    history = Column(Text, default="[]")  # JSON [{role:user/agent, content:..., image_url?:...}]
    created_at = Column(DateTime, server_default=func.now())

class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    step_index = Column(Integer)
    step_type = Column(String)  # llm_thought / tool_call
    tool_name = Column(String, default="")
    input_params = Column(Text, default="")
    output_result = Column(Text, default="")
    duration_ms = Column(Integer, default=0)
    llm_response = Column(Text, default="")
