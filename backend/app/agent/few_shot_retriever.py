from app.llm.embeddings import embed_text
from app.models.few_shot import FewShotExample
from app.models import SessionLocal
import math

class FewShotRetriever:
    """基于向量相似度检索最相关的 Few-Shot 示例"""

    _cache = None

    @classmethod
    def _load_all(cls):
        if cls._cache is not None:
            return cls._cache
        db = SessionLocal()
        try:
            rows = db.query(FewShotExample).all()
            # 预计算所有示例的向量
            examples = []
            for r in rows:
                vec = embed_text(r.user_input)
                if vec:
                    examples.append({
                        'id': r.id,
                        'title': r.title,
                        'user_input': r.user_input,
                        'correct_response': r.correct_response,
                        'vector': vec
                    })
            cls._cache = examples
            return cls._cache
        finally:
            db.close()

    @classmethod
    def refresh(cls):
        cls._cache = None

    @classmethod
    def retrieve(cls, query: str, top_k: int = 2):
        examples = cls._load_all()
        if not examples:
            return []
        qvec = embed_text(query)
        if not qvec:
            return []

        def _norm(v):
            return math.sqrt(sum(x * x for x in v))

        qnorm = _norm(qvec)
        scores = []
        for ex in examples:
            dot = sum(a * b for a, b in zip(qvec, ex['vector']))
            vnorm = _norm(ex['vector'])
            sim = dot / (qnorm * vnorm) if qnorm * vnorm > 0 else 0
            scores.append((sim, ex))

        scores.sort(key=lambda x: -x[0])
        return [ex for _, ex in scores[:top_k]]


def format_few_shot_prompt(query: str, top_k: int = 2) -> str:
    """将最相关的 Few-Shot 示例格式化为 prompt 片段"""
    examples = FewShotRetriever.retrieve(query, top_k)
    print(f"[few-shot] query='{query}' matched={len(examples)} examples")
    if not examples:
        return ""
    lines = ["【参考示例】（以下是我们团队维护的优质回答范例，请模仿其风格、格式和详细程度）："]
    for i, ex in enumerate(examples, 1):
        lines.append(f"示例{i}：")
        lines.append(f"用户：{ex['user_input']}")
        lines.append(f"助手：{ex['correct_response']}")
        lines.append("")
    prompt = "\n".join(lines)
    print(f"[few-shot] injected prompt length={len(prompt)}")
    return prompt
