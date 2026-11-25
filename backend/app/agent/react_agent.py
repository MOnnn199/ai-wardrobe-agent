import json
import time
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from app.llm import get_llm_client
from app.agent.tool_registry import ToolRegistry
from app.agent.agent_logger import AgentLogger
from app.agent.few_shot_retriever import format_few_shot_prompt

SYSTEM_PROMPT = """你是一个专业的穿搭推荐助手。
每次推荐请按以下步骤推理：
1. 分析用户需求（场合、风格偏好、天气）
2. 调用工具获取必要信息（天气、衣橱、知识库等）
3. 综合信息给出推荐方案
4. 每次输出三套方案，每套附上推荐理由

【数据隔离铁律】你只能访问当前登录用户的衣橱。所有 get_wardrobe / check_outfit / search_similar_clothes / get_my_outfits 等工具都会自动注入当前用户 ID，严禁推荐其他用户的衣物。如果用户衣橱里没有合适单品，请明确说明"你的衣橱里缺少 XX，建议补充"，而不是臆造或引用他人衣物。

注意：当你需要穿搭规则、场合礼仪或风格指南时，优先调用 retrieve_knowledge 从知识库检索权威资料。
注意：当用户询问天气或需要结合天气做推荐时，优先查询用户当前定位城市的天气；只有当用户明确指定其他城市时，才按用户要求查询指定城市。"""


class AgentState(TypedDict, total=False):
    messages: list
    user_id: int
    conversation_id: int
    city: Optional[str]
    lat: Optional[float]
    lon: Optional[float]
    iteration: int
    max_iterations: int
    final_answer: str


class ReActAgent:
    """基于 LangGraph 状态机的 ReAct 智能体（对外接口与旧实现兼容）。

    图结构：START -> agent ->(tools | end) tools -> agent
    - agent 节点：把 messages 发给 LLM（带工具 schema），产出 assistant 消息
    - tools 节点：执行所有 tool_calls，把结果作为 tool 消息追加
    - 条件边：有 tool_calls 则去 tools，否则结束
    """

    def __init__(self, tool_registry: ToolRegistry, llm=None):
        # 未显式注入时按 MODEL_CONFIG["provider"] 选择客户端（deepseek / zhipu）
        from app.llm import get_llm_client
        self.llm = llm or get_llm_client()
        self.tool_registry = tool_registry
        self.logger = AgentLogger()
        self.used_tools = set()   # 本轮对话实际调用过的工具名（用于判断是否需要返回衣橱卡片）

    # ---------- 提示词 / 上下文 ----------
    @staticmethod
    def load_online_prompt(default: str = SYSTEM_PROMPT) -> str:
        """读取运营端发布的 online PromptVersion；无则返回默认 system prompt。"""
        try:
            from app.models import SessionLocal
            from app.models.config import PromptVersion
            db = SessionLocal()
            try:
                p = db.query(PromptVersion).filter(
                    PromptVersion.status == 'online'
                ).order_by(PromptVersion.deployed_at.desc()).first()
                if p and p.content and p.content.strip():
                    return p.content
            finally:
                db.close()
        except Exception as e:
            print(f"[react_agent] load online prompt failed: {e}")
        return default

    @staticmethod
    def _inject_context(func_name: str, func_args: dict, state: dict):
        """按工具注入当前用户上下文（user_id / 定位），保证数据隔离与查询正确。"""
        city, lat, lon = state.get("city"), state.get("lat"), state.get("lon")
        user_id = state.get("user_id") or 0
        if func_name == "get_weather":
            requested_city = func_args.get("city")
            if requested_city and requested_city != city:
                func_args.pop("lat", None)
                func_args.pop("lon", None)
            else:
                if city and not requested_city:
                    func_args["city"] = city
                if lat is not None and "lat" not in func_args:
                    func_args["lat"] = lat
                if lon is not None and "lon" not in func_args:
                    func_args["lon"] = lon
        if func_name in ("get_wardrobe", "check_outfit", "search_similar_clothes",
                         "get_user_profile", "get_my_outfits",
                         "score_outfit_detailed", "get_seasonal_suitability") and user_id:
            # 强制覆盖，防止 LLM 自行传入错误/他人的 user_id，确保数据隔离
            func_args["user_id"] = user_id

    # ---------- 图节点 ----------
    def _agent_node(self, state: dict) -> dict:
        messages = list(state["messages"])
        tools = self.tool_registry.get_enabled_definitions()
        start = time.time()
        response = self.llm.chat(messages, tools=tools)
        duration = int((time.time() - start) * 1000)
        choice = response.get("choices", [{}])[0]
        msg = choice.get("message", {})
        iteration = state.get("iteration", 0) + 1

        assistant_msg = {"role": "assistant", "content": msg.get("content") or None}
        if msg.get("tool_calls"):
            assistant_msg["tool_calls"] = msg["tool_calls"]
        messages.append(assistant_msg)

        out = {"messages": messages, "iteration": iteration}
        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            final = msg.get("content") or ""
            out["final_answer"] = final
            self.logger.log_step(
                state.get("conversation_id", 0), iteration, "final_answer",
                duration_ms=duration, llm_response=final,
                user_id=state.get("user_id", 0), trace_type="agent")
        return out

    def _tools_node(self, state: dict) -> dict:
        messages = list(state["messages"])
        # 取最后一条 assistant 消息（含 tool_calls）
        last = messages[-1] if messages else {}
        for tc in last.get("tool_calls", []):
            func_name = tc["function"]["name"]
            self.used_tools.add(func_name)   # 记录实际调用过的工具
            try:
                func_args = json.loads(tc["function"]["arguments"])
            except Exception:
                func_args = {}
            self._inject_context(func_name, func_args, state)
            tool = self.tool_registry.get(func_name)
            start = time.time()
            result = tool.execute(func_args) if tool and tool.enabled else '{"error": "tool unavailable"}'
            duration = int((time.time() - start) * 1000)
            messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})
            self.logger.log_step(
                state.get("conversation_id", 0), state.get("iteration", 0),
                "tool_call", func_name, json.dumps(func_args, ensure_ascii=False), result,
                duration, last.get("content", ""), user_id=state.get("user_id", 0), trace_type="agent")
        return {"messages": messages}

    def _router(self, state: dict) -> str:
        if state.get("iteration", 0) >= state.get("max_iterations", 10):
            return "end"
        messages = state.get("messages", [])
        last = messages[-1] if messages else {}
        return "tools" if last.get("tool_calls") else "end"

    # ---------- 对外入口 ----------
    def run(self, user_input: str, user_id: int = 0, conversation_id: int = 0,
            system_prompt: str = None, max_iterations: int = 10,
            city: str = None, lat: float = None, lon: float = None,
            history: list = None) -> str:
        self.used_tools = set()   # 每轮对话重置
        if not system_prompt:
            system_prompt = self.load_online_prompt()

        few_shot_text = format_few_shot_prompt(user_input, top_k=2)
        user_content = user_input
        if few_shot_text:
            user_content = f"{few_shot_text}\n\n现在请回答以下用户问题：\n用户：{user_input}\n助手："

        effective_system = system_prompt
        if city:
            loc_ctx = f"\n\n【用户定位信息】当前定位城市：{city}"
            if lat is not None and lon is not None:
                loc_ctx += f"（经纬度：{lat:.4f}, {lon:.4f}）"
            loc_ctx += "。当用户询问穿搭、天气或需要天气信息时，默认查询该城市的天气；若用户明确要求其他城市，再按用户要求查询。"
            effective_system = effective_system + loc_ctx

        messages = [{"role": "system", "content": effective_system}]
        if history:
            for h in history:
                role = "assistant" if h.get("role") == "agent" else h.get("role", "user")
                messages.append({"role": role, "content": h.get("content", "")})
        messages.append({"role": "user", "content": user_content})

        graph = StateGraph(AgentState)
        graph.add_node("agent", self._agent_node)
        graph.add_node("tools", self._tools_node)
        graph.add_edge(START, "agent")
        graph.add_conditional_edges("agent", self._router, {"tools": "tools", "end": END})
        graph.add_edge("tools", "agent")
        app = graph.compile()

        result = app.invoke({
            "messages": messages,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "city": city,
            "lat": lat,
            "lon": lon,
            "iteration": 0,
            "max_iterations": max_iterations,
        })
        final = result.get("final_answer")
        if final and final.strip():
            return final
        # ── 二次追问：如果发生过 tool_call 但模型第 2 轮返回了空消息（智谱 glm-4.5/5.x 在长 system + 多 tools 时常见），
        # 主动追加一条"请基于以上工具结果给出最终方案"的 prompt，让模型补一条正经回复。
        if result.get("messages"):
            had_tool_call = any(m.get("role") == "tool" for m in result["messages"])
            if had_tool_call and not (final and final.strip()):
                retry_msgs = list(result["messages"]) + [
                    {"role": "user", "content": (
                        "请直接以 markdown 的形式给出你的最终搭配方案（3 套搭配，每套说明单品 + 理由），"
                        "不要再调用任何工具，只输出方案正文。"
                    )}
                ]
                # 用纯文本模式（不传 tools）确保模型专心输出文字
                retry = self.llm.chat(retry_msgs, tools=[])
                c = retry.get("choices", [{}])[0].get("message", {})
                txt = (c.get("content") or "").strip()
                if txt:
                    return txt
        # ReAct 没拿到 final_answer：要么到了 max_iterations，要么模型返回了空消息。
        last_msg = ""
        if result.get("messages"):
            for m in reversed(result["messages"]):
                if m.get("role") == "assistant":
                    last_msg = (m.get("content") or "").strip()
                    break
        if last_msg:
            return f"模型未给出完整回复，请重试或换模型。（最后一条回复：{last_msg[:120]}）"
        iterations = result.get("iteration", 0)
        if iterations >= max_iterations:
            return f"模型思考步数超过上限（{max_iterations}），可能是问题太复杂，可换更简单的问法或切换其它模型。"
        return "模型未给出完整回复，请稍后重试或换模型试试。"
