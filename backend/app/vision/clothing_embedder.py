"""CLIP 衣物图像向量化（基于 modelscope 缓存的 sentence-transformers/clip-ViT-B-32）。

- embed_image: 图片 → 向量（存 clothing_store.json）
- embed_text:  文本描述 → 向量（用于「相似款检索」的 query 编码）

模型不可用时返回 None，调用方优雅降级（向量化失败不阻断主流程）。
"""

import io
import os

_MODEL_CACHE = os.getenv("MODELSCOPE_CACHE", r"E:\models")
_CLIP_MODEL_ID = os.getenv("CLIP_MODEL_ID", "sentence-transformers/clip-ViT-B-32")


class ClothingEmbedder:
    _model = None

    @classmethod
    def _resolve_path(cls) -> str | None:
        # 1) 先找已下载的 modelscope 快照
        name = _CLIP_MODEL_ID.replace("/", "--")
        base = os.path.join(_MODEL_CACHE, "models", name, "snapshots")
        if os.path.isdir(base):
            snapshots = [os.path.join(base, d) for d in os.listdir(base)]
            if snapshots:
                snapshots.sort(key=lambda p: os.path.getmtime(p), reverse=True)
                return snapshots[0]
        # 2) 尝试直接下载
        try:
            from modelscope import snapshot_download
            return snapshot_download(_CLIP_MODEL_ID, cache_dir=_MODEL_CACHE)
        except Exception as e:
            print(f"[clothing_embedder] modelscope download failed: {e}")
            return None

    @classmethod
    def _load(cls):
        if cls._model is not None:
            return cls._model
        path = cls._resolve_path()
        if not path:
            return None
        try:
            from sentence_transformers import SentenceTransformer
            cls._model = SentenceTransformer(path)
            print(f"[clothing_embedder] CLIP loaded from {path}")
        except Exception as e:
            print(f"[clothing_embedder] load failed: {e}")
            cls._model = None
        return cls._model

    @classmethod
    def embed_image(cls, image_bytes: bytes) -> list[float] | None:
        model = cls._load()
        if model is None:
            return None
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")
            vec = model.encode([img], convert_to_numpy=True)[0]
            return [float(x) for x in vec]
        except Exception as e:
            print(f"[clothing_embedder] embed_image failed: {e}")
            return None

    @classmethod
    def embed_text(cls, text: str) -> list[float] | None:
        model = cls._load()
        if model is None:
            return None
        try:
            vec = model.encode([text], convert_to_numpy=True)[0]
            return [float(x) for x in vec]
        except Exception as e:
            print(f"[clothing_embedder] embed_text failed: {e}")
            return None
