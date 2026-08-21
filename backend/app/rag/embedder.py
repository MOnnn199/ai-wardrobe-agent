from app.llm.embeddings import get_embedder, embed_text, _default_client

class Embedder:
    def __init__(self):
        self.client = get_embedder()

    def embed(self, text: str) -> list[float] | None:
        return self.client.embed(text)

    @property
    def dimension(self) -> int:
        return getattr(self.client, "dimension", 384)

    @property
    def cluster_threshold(self) -> float:
        return getattr(self.client, "cluster_threshold", 0.70)


def rebuild_vectors(db_session, vector_store):
    """
    当切换 embedding 模型（维度变化）时，基于 knowledge_chunks 表重建向量库。
    用法：在启动时或管理接口中调用。
    """
    from app.models.knowledge import KnowledgeChunk

    print("[rebuild] Clearing old vectors...")
    vector_store._chunks.clear()
    vector_store._vectors.clear()

    chunks = db_session.query(KnowledgeChunk).all()
    print(f"[rebuild] Rebuilding {len(chunks)} vectors with dimension={_default_client.dimension}...")

    failed = 0
    for kc in chunks:
        vec = embed_text(kc.text)
        if vec is None:
            failed += 1
            import random
            vec = [random.random() for _ in range(_default_client.dimension)]
        vector_store.add_chunk(kc.chunk_id, vec, kc.text, {"source": kc.source})

    vector_store._save()
    print(f"[rebuild] Done. total={len(chunks)}, failed={failed}")
    return {"total": len(chunks), "failed": failed, "dimension": _default_client.dimension}
