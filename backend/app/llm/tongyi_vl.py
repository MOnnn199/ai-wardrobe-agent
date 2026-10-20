import httpx
from app.config import TONGYI_API_KEY

class TongyiVLClient:
    def __init__(self):
        self.api_key = TONGYI_API_KEY
        self.endpoint = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"

    def _model_name(self) -> str:
        try:
            from app.config import MODEL_CONFIG
            return MODEL_CONFIG.get("vision_model") or "qwen3-vl-plus"
        except Exception:
            return "qwen3-vl-plus"

    def analyze_image(self, image_base64: str, prompt: str = "请描述这张图片中的商品") -> str:
        if not self.api_key or not self.api_key.strip():
            return "（未配置 TONGYI_API_KEY，无法调用通义识图）"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self._model_name(),
            "input": {
                "messages": [{
                    "role": "user",
                    "content": [
                        {"image": f"data:image/jpeg;base64,{image_base64}"},
                        {"text": prompt}
                    ]
                }]
            }
        }
        try:
            with httpx.Client(timeout=30) as client:
                resp = client.post(self.endpoint, headers=headers, json=body)
            result = resp.json()
        except Exception as e:
            return f"（通义识图调用失败：{e}）"

        # 成功结构：output.choices[0].message.content = [{"text": "..."}, ...]
        try:
            blocks = result["output"]["choices"][0]["message"]["content"]
            text = "".join(b.get("text", "") for b in blocks if isinstance(b, dict) and b.get("text"))
            if text:
                return text
        except (KeyError, IndexError, TypeError):
            pass

        # 失败结构：{ "code": "...", "message": "..." }
        code = result.get("code")
        msg = result.get("message")
        if code or msg:
            return f"（通义识图失败：{code} {msg}）"
        return ""
