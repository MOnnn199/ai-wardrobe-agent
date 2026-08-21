"""
知识缺口语义聚类

把「低分待处理」的对话按语义相似度自动归组：
- 同一类问题即使表述不同（如"小个子怎么穿" vs "矮个子女生显高搭配"）也能聚到一起
- 代表文本取簇内与质心余弦相似度最高的那条原句
- 若 embedding 服务不可用，返回 None 让调用方降级到前缀匹配
"""
import math
import hashlib
from app.rag.embedder import Embedder


def topic_key(text: str) -> str:
    """用代表句文本生成稳定 key，用于把实时聚类结果和持久化的处理状态关联。"""
    return hashlib.md5((text or '').strip().encode('utf-8')).hexdigest()[:16]

_embedder = Embedder()


def _cosine(a, b):
    if not a or not b:
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


def semantic_cluster(items, threshold=None):
    """
    items: list of (conv_id, text)
    返回: list of {topic, frequency, example_inputs, conv_ids} 或 None（embedding 不可用）
    """
    if threshold is None:
        threshold = getattr(_embedder, "cluster_threshold", 0.70)
    if not items:
        return []

    # 1. 批量转向量
    grouped = []  # (conv_id, text, vec)
    for cid, text in items:
        vec = _embedder.embed(text)
        if vec is None:
            return None  # embedding 不可用，触发降级
        grouped.append((cid, text, vec))

    # 2. 贪心聚类：每条找最相似的已有簇，超过阈值则并入，否则新建
    clusters = []  # {'center': vec, 'items': [(cid, text, vec)]}
    for cid, text, vec in grouped:
        best_sim = -1.0
        best_idx = -1
        for i, cl in enumerate(clusters):
            sim = _cosine(vec, cl["center"])
            if sim > best_sim:
                best_sim = sim
                best_idx = i
        if best_idx >= 0 and best_sim >= threshold:
            cl = clusters[best_idx]
            cl["items"].append((cid, text, vec))
            # 更新质心为簇内向量均值
            n = len(cl["items"])
            cl["center"] = [sum(coords) / n for coords in zip(*[it[2] for it in cl["items"]])]
        else:
            clusters.append({"center": vec, "items": [(cid, text, vec)]})

    # 3. 每个簇选代表文本（与质心最相似的原句），并统计
    result = []
    for cl in clusters:
        rep_cid, rep_text, _ = max(cl["items"], key=lambda it: _cosine(it[2], cl["center"]))
        result.append({
            "topic": rep_text,
            "frequency": len(cl["items"]),
            "example_inputs": [t for _, t, _ in cl["items"]],
            "conv_ids": [c for c, _, _ in cl["items"]],
        })

    result.sort(key=lambda x: -x["frequency"])
    return result[:10]
