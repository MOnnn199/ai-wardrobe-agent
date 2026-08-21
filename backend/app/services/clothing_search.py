"""衣物向量存储与检索。

- add_clothing_vector(item_id, vector): 存衣物图像向量（key=item id）
- remove_clothing_vector(item_id)
- search_clothing(query_vec, top_k, user_id=None): 余弦检索，可按用户过滤
向量文件：backend/chroma_data/clothing_store.json（独立于知识库 store.json）。
"""

import os

from app.rag.vector_store import VectorStore

_CLOTHING_STORE_FILE = "clothing_store.json"


def _store() -> VectorStore:
    return VectorStore(persist_dir=os.getenv("VECTOR_DIR", "./chroma_data"),
                       store_file=_CLOTHING_STORE_FILE)


def add_clothing_vector(item_id: int, vector: list[float], metadata: dict | None = None):
    store = _store()
    store.add_chunk(str(item_id), vector, f"clothing:{item_id}", metadata or {})


def remove_clothing_vector(item_id: int):
    _store().delete([str(item_id)])


def search_clothing(query_vector: list[float], top_k: int = 5,
                    user_id: int | None = None, min_score: float = 0.15):
    """返回 [{id: item_id, score, metadata}]；user_id 提供时仅返回该用户的衣物。"""
    store = _store()
    results = store.search(query_vector, top_k=top_k, min_score=min_score)
    if user_id is not None:
        results = [r for r in results if int(r.get("metadata", {}).get("user_id", -1)) == user_id]
    return results
