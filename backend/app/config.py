import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(encoding="utf-8-sig")

# 后端根目录（backend/），用于拼接绝对路径 db，避免被启动 cwd 影响。
# 旧版用 sqlite:///./app.db 是相对路径，从项目根启动时 cwd=仓库根，会
# 创建一个空的 E:\ai-wardrobe-agent\app.db，与真正的 backend/app.db 不
# 一致，导致「用户管理只显示 3 个 seed、所有历史数据消失」的假象（2026-08-25 复盘）。
BACKEND_ROOT = Path(__file__).resolve().parent.parent

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
TONGYI_API_KEY = os.getenv("TONGYI_API_KEY", "")
# 通义千问（Qwen）：DashScope OpenAI 兼容模式
TONGYI_API_BASE = os.getenv("TONGYI_API_BASE", "https://dashscope.aliyuncs.com/compatible-mode/v1")
# 智谱 AI（GLM 系列）：OpenAI 兼容接口，key 为 JWT 格式 "{id}.{secret}"
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
ZHIPU_API_BASE = os.getenv("ZHIPU_API_BASE", "https://open.bigmodel.cn/api/paas/v4")
# JWT 签名密钥：默认每次进程启动随机生成（仅存内存，不落库）。
# 效果：重启后端后所有已签发 token 全部失效 → 用户端 / 运营端 / 搭配师端都必须重新登录。
# 如需让登录态跨重启保持（生产部署），在 .env 中设置固定的 JWT_SECRET_KEY。
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32)
# db url：默认指向 backend/app.db（绝对路径），不依赖启动 cwd；.env 里可覆盖。
_DEFAULT_DB_PATH = (BACKEND_ROOT / "app.db").as_posix()
DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{_DEFAULT_DB_PATH}"

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
