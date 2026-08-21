import httpx
import os
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE

# ==================== DeepSeek API 版本（备选） ====================
class EmbeddingClient:
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.api_base = DEEPSEEK_API_BASE
        self.model = "deepseek-embedding"
        self.dimension = 1536
        self.cluster_threshold = 0.70

    def embed(self, text: str) -> list[float] | None:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        body = {
            "model": self.model,
            "input": text
        }
        try:
            with httpx.Client(timeout=30) as client:
                resp = client.post(
                    f"{self.api_base}/v1/embeddings",
                    headers=headers,
                    json=body
                )
            data = resp.json()
            return data["data"][0]["embedding"]
        except Exception as e:
            print(f"[embedding warn] DeepSeek api failed: {e}")
            return None


# ==================== 本地 sentence-transformers 版本（默认） ====================
class LocalEmbeddingClient:
    """本地 embedding，完全免费、离线可用、不依赖外部 API"""

    _instance = None

    def __new__(cls, *args, **kwargs):
        # 单例，避免重复加载模型
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str | None = None):
        if self._initialized:
            return
        self.model_name = model_name or os.getenv("LOCAL_EMBED_MODEL", "BAAI/bge-small-zh")
        self._model = None
        self.dimension = 384
        # 不同模型的余弦相似度分布不同，聚类阈值需分别标定
        self.cluster_threshold = 0.85 if "bge" in self.model_name else 0.70
        self._initialized = True

    def _resolve_model_path(self):
        name = self.model_name
        # 1. 绝对路径直接使用
        if os.path.isdir(name):
            return name
        # 2. ModelScope id（如 BAAI/bge-small-zh）：已下载则直接返回缓存路径，否则自动下载
        if "/" in name:
            try:
                from modelscope import snapshot_download
                cache_dir = os.getenv("MODELSCOPE_CACHE", "E:/models")
                return snapshot_download(name, cache_dir=cache_dir)
            except Exception as e:
                print(f"[embedding] modelscope resolve failed: {e}")
        # 3. 回退到 huggingface 本地缓存目录
        return os.path.join(os.getenv("LOCAL_MODEL_CACHE", "E:/models/sentence-transformers"), name)

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            model_path = self._resolve_model_path()
            print(f"[embedding] Loading local model from: {model_path} ...")
            self._model = SentenceTransformer(model_path)
            # 实际维度以模型输出为准
            test_vec = self._model.encode("test", convert_to_numpy=True)
            self.dimension = int(test_vec.shape[0])
            print(f"[embedding] Local model loaded, dimension={self.dimension}")
        return self._model

    def embed(self, text: str) -> list[float] | None:
        try:
            model = self._load_model()
            vec = model.encode(text, convert_to_numpy=True)
            return vec.tolist()
        except Exception as e:
            print(f"[embedding warn] Local model failed: {e}")
            return None


# ==================== 统一入口 ====================
# 通过环境变量 EMBED_PROVIDER 切换：local（默认） | deepseek
EMBED_PROVIDER = os.getenv("EMBED_PROVIDER", "local").lower()

if EMBED_PROVIDER == "deepseek":
    _default_client = EmbeddingClient()
else:
    _default_client = LocalEmbeddingClient()


def get_embedder():
    """获取当前配置的 embedder 实例"""
    return _default_client


def embed_text(text: str) -> list[float] | None:
    """便捷函数：直接对文本做 embedding"""
    return _default_client.embed(text)
