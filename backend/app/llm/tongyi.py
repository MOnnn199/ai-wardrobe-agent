"""通义千问（Qwen）文本对话客户端：DashScope OpenAI 兼容模式。

接口形态与 DeepSeekClient 完全一致（chat() 签名、tools 透传、成本记录、无 key 兜底）。
文档：https://help.aliyun.com/zh/model-studio/getting-started/models
"""

import httpx
from app.config import TONGYI_API_KEY, TONGYI_API_BASE


def _track(user_id: int, model: str, tokens_in: int, tokens_out: int):
    """就地记录 LLM 成本，失败静默。"""
    try:
        from app.services.cost_tracker import record_llm_cost
        record_llm_cost(user_id=user_id, model=model, tokens_in=tokens_in, tokens_out=tokens_out)
    except Exception:
        pass


class TongyiClient:
    def __init__(self):
        self.api_key = TONGYI_API_KEY
        self.api_base = TONGYI_API_BASE
        self.model = "qwen-plus"

    def chat(self, messages: list, tools: list = None, temperature: float = None, user_id: int = 0):
        # 运行时模型配置：未显式传参时读共享配置
        from app.config import MODEL_CONFIG
        self.model = MODEL_CONFIG.get("model_name") or "qwen-plus"
        if temperature is None:
            temperature = MODEL_CONFIG.get("temperature", 0.7)
        top_p = MODEL_CONFIG.get("top_p", 1.0)
        # 兜底：未配置 API Key 时返回模拟响应
        if not self.api_key or not self.api_key.strip():
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "（演示模式）请先在 backend/.env 中配置 TONGYI_API_KEY 以调用真实模型。"
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
            with httpx.Client(timeout=30) as client:
                resp = client.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=body
                )
        except Exception as e:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"模型调用异常：{e}",
                    },
                    "finish_reason": "stop"
                }]
            }
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
        # 记录 token 成本
        usage = data.get("usage", {})
        _track(user_id, self.model,
               usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0))
        return data
