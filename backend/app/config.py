import os
from dotenv import load_dotenv

load_dotenv(encoding="utf-8-sig")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
TONGYI_API_KEY = os.getenv("TONGYI_API_KEY", "")
# 通义千问（Qwen）：DashScope OpenAI 兼容模式
TONGYI_API_BASE = os.getenv("TONGYI_API_BASE", "https://dashscope.aliyuncs.com/compatible-mode/v1")
# 智谱 AI（GLM 系列）：OpenAI 兼容接口，key 为 JWT 格式 "{id}.{secret}"
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
ZHIPU_API_BASE = os.getenv("ZHIPU_API_BASE", "https://open.bigmodel.cn/api/paas/v4")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# ===== LLM 模型运行时配置（运营端「模型配置」页修改的同一份；内存态，重启恢复默认）=====
# provider: 模型供应商（deepseek / zhipu），决定用哪个客户端；model_name 对应供应商的模型名
# 文本对话模型 / 温度 / top_p；VLM 模型用于识图。
MODEL_CONFIG = {
    "provider": os.getenv("LLM_PROVIDER", "deepseek"),
    "model_name": os.getenv("DEFAULT_LLM_MODEL", "deepseek-chat"),
    "temperature": float(os.getenv("DEFAULT_TEMPERATURE", "0.7")),
    "top_p": float(os.getenv("DEFAULT_TOP_P", "1.0")),
    "vision_model": os.getenv("VISION_MODEL", "qwen-vl-plus"),
}

# 跨域白名单（前端 dev 端口 5173/5175；可按需通过 CORS_ORIGINS=逗号分隔覆盖）
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175").split(",") if o.strip()]
