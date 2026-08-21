import json
import os
import math


class VectorStore:
    """轻量 JSON 向量库（无外部依赖）。

    支持多个集合：每个实例对应一个文件（如 store.json=知识库、clothing_store.json=衣物向量）。
    维度一致性由调用方保证（启动时已做维度校验/重建）。
    """

    def __init__(self, persist_dir='./chroma_data', store_file='store.json'):
        self.persist_dir = persist_dir
        self.store_file = store_file
        self._chunks = {}
        self._vectors = {}
        self._load()

    def _path(self):
        return os.path.join(self.persist_dir, self.store_file)

    def _load(self):
        path = self._path()
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self._chunks = data.get('chunks', {})
                self._vectors = {k: v for k, v in data.get('vectors', {}).items()}

    def _save(self):
        os.makedirs(self.persist_dir, exist_ok=True)
        with open(self._path(), 'w', encoding='utf-8') as f:
            json.dump({'chunks': self._chunks, 'vectors': self._vectors}, f, ensure_ascii=False)

    def add_chunk(self, chunk_id, vector, text, metadata=None):
        self._chunks[chunk_id] = {'text': text, 'metadata': metadata or {}}
        self._vectors[chunk_id] = vector
        self._save()

    def search(self, query_vector, top_k=3, min_score=0.0):
        scores = []
        for cid, vec in self._vectors.items():
            dot = sum(a * b for a, b in zip(query_vector, vec))
            norm_q = math.sqrt(sum(a * a for a in query_vector))
            norm_v = math.sqrt(sum(a * a for a in vec))
            sim = dot / (norm_q * norm_v) if norm_q * norm_v > 0 else 0
            if sim >= min_score:
                scores.append((sim, cid))
        scores.sort(key=lambda x: -x[0])
        results = []
        for sim, cid in scores[:top_k]:
            chunk = self._chunks.get(cid, {})
            results.append({'text': chunk.get('text', ''), 'score': sim, 'id': cid,
                            'metadata': chunk.get('metadata', {})})
        return results

    def delete(self, ids):
        for cid in ids:
            self._chunks.pop(cid, None)
            self._vectors.pop(cid, None)
        self._save()

    @property
    def vectors(self):
        return self._vectors
