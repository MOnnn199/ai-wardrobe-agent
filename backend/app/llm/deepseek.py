import httpx
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE


def _track(user_id: int, model: str, tokens_in: int, tokens_out: int):
    """就地记录 LLM 成本，失败静默。"""
    try:
        from app.services.cost_tracker import record_llm_cost
        record_llm_cost(user_id=user_id, model=model, tokens_in=tokens_in, tokens_out=tokens_out)
    except Exception:
        pass


class DeepSeekClient:
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.api_base = DEEPSEEK_API_BASE
        self.model = "deepseek-chat"

    def chat(self, messages: list, tools: list = None, temperature: float = None, user_id: int = 0):
        # 运行时模型配置（运营端「模型配置」页可改）：未显式传参时读共享配置
        from app.config import MODEL_CONFIG
        self.model = MODEL_CONFIG.get("model_name") or "deepseek-chat"
        if temperature is None:
            temperature = MODEL_CONFIG.get("temperature", 0.7)
        top_p = MODEL_CONFIG.get("top_p", 1.0)
        # 兜底：未配置 API Key 时返回模拟响应，避免空 Authorization header 导致 500
        if not self.api_key or not self.api_key.strip():
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "（演示模式）请先在 backend/.env 中配置 DEEPSEEK_API_KEY 以调用真实模型。"
                    },
                    "finish_reason": "stop"
                }]
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
        }
        if tools:
            body["tools"] = tools

        try:
            # 周末/晚高峰 DeepSeek 网关也偶发 30s 读超时，对齐 zhipu 提到 90s
            with httpx.Client(timeout=90) as client:
                resp = client.post(
                    f"{self.api_base}/v1/chat/completions",
                    headers=headers,
                    json=body
                )
                if resp.status_code >= 400:
                    return {
                        "choices": [{
                            "message": {
                                "role": "assistant",
                                "content": f"模型调用失败（HTTP {resp.status_code}），请稍后重试或检查 API Key/余额。"
                            },
                            "finish_reason": "stop"
                        }]
                    }
            data = resp.json()
        except Exception as e:
            # httpx.ReadTimeout / ConnectError 等一律转成友好提示，避免穿透到 FastAPI 成 500
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"模型调用异常：{e}"
                    },
                    "finish_reason": "stop"
                }]
            }
        # 记录 token 成本
        usage = data.get("usage", {})
        _track(user_id, self.model,
               usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0))
        return data

    def chat_with_web_search(self, user_text: str, system: str = "", user_id: int = 0) -> str:
        """DeepSeek Responses API + 内置 web_search 工具：模型服务端实时联网检索并整理，一次请求拿成品。

        仅 deepseek-v4-flash 支持 web_search（Chat Completions 不支持），且 web_search 仅在
        Responses API（/responses）形态下可用。无独立搜索费，只按 token 计费。复用现有 DEEPSEEK_API_KEY。
        """
        if not self.api_key or not self.api_key.strip():
            return "（演示模式）请先在 backend/.env 中配置 DEEPSEEK_API_KEY 以调用真实模型。"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        input_msgs = []
        if system:
            input_msgs.append({"role": "system", "content": system})
        input_msgs.append({"role": "user", "content": user_text})
        body = {
            "model": "deepseek-v4-flash",
            "input": input_msgs,
            "tools": [{"type": "web_search"}],
        }
        try:
            with httpx.Client(timeout=60) as client:
                resp = client.post(f"{self.api_base}/responses", headers=headers, json=body)
                if resp.status_code >= 400:
                    return f"模型调用失败（HTTP {resp.status_code}），请稍后重试或检查 API Key/余额。"
                data = resp.json()
                # 记录 token 成本（Responses API 的 usage 字段）
                usage = data.get("usage", {})
                tin = usage.get("input_tokens", 0) or usage.get("prompt_tokens", 0)
                tout = usage.get("output_tokens", 0) or usage.get("completion_tokens", 0)
                _track(user_id, "deepseek-v4-flash", tin, tout)
                # 优先取聚合文本字段；否则遍历 output 找 message 项
                if data.get("output_text"):
                    return data["output_text"].strip()
                for item in data.get("output", []):
                    if item.get("type") == "message":
                        texts = [c.get("text", "") for c in item.get("content", []) if c.get("type") == "output_text"]
                        return "".join(texts).strip()
                return ""
        except Exception as e:
            return f"模型调用异常：{e}"
