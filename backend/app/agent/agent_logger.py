import time
from app.models import SessionLocal
from app.models.trace import AgentTrace


class AgentLogger:
    """推理轨迹记录：同时保留内存副本（兼容 /api/chat 实时返回）并落库（供运营端历史审查）。"""

    def __init__(self):
        self.steps = []

    def log_step(self, conversation_id=0, step_index=0, step_type="", tool_name="",
                 input_params="", output_result="", duration_ms=0, llm_response="",
                 user_id=0, trace_type="agent", session_id=None):
        if session_id is None:
            session_id = str(conversation_id) if conversation_id else ("agent_" + str(int(time.time() * 1000)))
        entry = {
            "conversation_id": conversation_id,
            "step_index": step_index,
            "step_type": step_type,
            "tool_name": tool_name,
            "input_params": input_params,
            "output_result": output_result,
            "duration_ms": duration_ms,
            "llm_response": llm_response,
        }
        self.steps.append(entry)
        # 落库（持久化思考链）
        try:
            db = SessionLocal()
            db.add(AgentTrace(
                session_id=session_id,
                trace_type=trace_type,
                user_id=user_id,
                step_index=step_index,
                step_type=step_type,
                tool_name=tool_name,
                input_params=(input_params or "")[:2000],
                output_result=(output_result or "")[:4000],
                duration_ms=int(duration_ms or 0),
                llm_response=(llm_response or "")[:4000],
            ))
            db.commit()
            db.close()
        except Exception as e:
            print("[agent_logger] save failed:", e)

    def get_steps(self, conversation_id=0):
        return [s for s in self.steps if s["conversation_id"] == conversation_id]
