"""LLM 客户端工厂：根据 MODEL_CONFIG["provider"] 或模型名前缀返回对应供应商客户端。"""


def get_llm_client():
    from app.config import MODEL_CONFIG
    provider = (MODEL_CONFIG.get("provider") or "").lower()
    model_name = MODEL_CONFIG.get("model_name") or ""
    # 双保险：显式 provider 优先；未设置时按模型名前缀推断（glm-* → 智谱，qwen-* → 通义）
    if provider == "zhipu" or (not provider and model_name.startswith("glm-")):
        from app.llm.zhipu import ZhipuClient
        return ZhipuClient()
    if provider == "tongyi" or (not provider and model_name.startswith("qwen-")):
        from app.llm.tongyi import TongyiClient
        return TongyiClient()
    # 默认 DeepSeek
    from app.llm.deepseek import DeepSeekClient
    return DeepSeekClient()
