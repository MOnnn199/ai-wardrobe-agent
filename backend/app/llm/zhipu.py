import httpx
from app.config import ZHIPU_API_KEY, ZHIPU_API_BASE


def _track(user_id: int, model: str, tokens_in: int, tokens_out: int):
    """就地记录 LLM 成本，失败静默。"""
    try:
        from app.services.cost_tracker import record_llm_cost
        record_llm_cost(user_id=user_id, model=model, tokens_in=tokens_in, tokens_out=tokens_out)
    except Exception:
        pass


class ZhipuClient:
    """智谱 AI（GLM 系列）客户端 — OpenAI 兼容接口。

    API: POST {ZHIPU_API_BASE}/chat/completions
    认证: Authorization: Bearer {key}（key 为 JWT 格式 "{id}.{secret}"）
    模型: glm-4-flash / glm-4-plus / glm-4-air 等
    """

    def __init__(self):
        self.api_key = ZHIPU_API_KEY
        self.api_base = ZHIPU_API_BASE
        self.model = "glm-4-flash"

    def chat(self, messages: list, tools: list = None, temperature: float = None, user_id: int = 0):
        # 运行时模型配置（运营端「模型配置」页可改）：未显式传参时读共享配置
        from app.config import MODEL_CONFIG
        self.model = MODEL_CONFIG.get("model_name") or "glm-4-flash"
        if temperature is None:
            temperature = MODEL_CONFIG.get("temperature", 0.7)
        top_p = MODEL_CONFIG.get("top_p", 1.0)
        # 兜底：未配置 API Key 时返回模拟响应，避免空 Authorization header 导致 500
        if not self.api_key or not self.api_key.strip():
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "（演示模式）请先在 backend/.env 中配置 ZHIPU_API_KEY 以调用真实模型。"
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
            with httpx.Client(timeout=60) as client:
                resp = client.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=body
                )
            if resp.status_code >= 400:
                detail = ""
                try:
                    detail = resp.json().get("error", {}).get("message", "") or resp.text[:200]
                except Exception:
                    detail = resp.text[:200]
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": f"模型调用失败（HTTP {resp.status_code}）：{detail}"
                        },
                        "finish_reason": "stop"
                    }]
                }
            data = resp.json()
        except Exception as e:
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
