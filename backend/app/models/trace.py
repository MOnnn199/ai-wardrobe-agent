from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from . import Base


class AgentTrace(Base):
    """AI 推理轨迹（思考链）落库：把每次推荐的完整推理步骤持久化，供运营端审查（不再黑箱）。"""

    __tablename__ = "agent_traces"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, default="")   # 一次推荐的会话聚合键（如 outfit_1_xxx）
    trace_type = Column(String, default="agent")          # agent / outfit_review / trend / chat
    user_id = Column(Integer, default=0)
    step_index = Column(Integer, default=0)
    step_type = Column(String, default="")                # input / tool_call / llm_response / final_answer
    tool_name = Column(String, default="")
    input_params = Column(Text, default="")
    output_result = Column(Text, default="")
    duration_ms = Column(Integer, default=0)
    llm_response = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
