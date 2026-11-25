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
        self.model = "glm-4.5"

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
            # 智谱在高峰期（如 19-21 点）网关冷启动慢，老的 60s 容易 read timeout → 90s 兜底
            with httpx.Client(timeout=90) as client:
                resp = client.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=body
                )
            if resp.status_code >= 400:
                detail = ""
                err_code = ""
                try:
                    err_obj = resp.json().get("error", {}) or {}
                    detail = err_obj.get("message", "") or resp.text[:200]
                    err_code = err_obj.get("code", "") or ""
                except Exception:
                    detail = resp.text[:200]
                # 智谱常见错误码：1301 余额不足 / 1302 速率限制 / 1303 模型不存在 / 1304 权限不足
                code_hint = f"[code={err_code}] " if err_code else ""
                user_msg = f"模型调用失败（HTTP {resp.status_code}）{code_hint}{detail}"
                # 1302/503：标记限流，提示重试
                if err_code == "1302" or resp.status_code == 429:
                    user_msg += "（智谱限流，请等待 1-2 秒后重试）"
                elif err_code == "1301":
                    user_msg += "（智谱账户余额不足，请充值或换模型）"
                elif err_code == "1303":
                    user_msg += "（该模型在你账户下不存在，请选用账户内可见的 glm-4.5/5.x 等）"
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
