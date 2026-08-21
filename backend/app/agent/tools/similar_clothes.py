import json
from ..tool_registry import Tool
from app.models import SessionLocal
from app.models.wardrobe import ClothingItem
from app.vision.clothing_embedder import ClothingEmbedder
from app.services import clothing_search


class SimilarClothesTool(Tool):
    """基于 CLIP 图像向量的语义相似款检索：输入文字描述或单品 id，返回衣橱中相似衣物。

    升级：completion_mode=True 时进入"配齐一套"模式——先定位基础单品，再按缺失类目
    （下装/鞋子等）自动补齐，返回可直接上身的完整套装。
    """

    def __init__(self):
        super().__init__(
            name="search_similar_clothes",
            description=(
                "在用户衣橱中检索与描述或指定单品相似的衣物（语义相似，支持风格/颜色/品类描述）。"
                "例如 query='白色休闲衬衫' 或 item_id=3。设 completion_mode=true 时：按 query/item_id 定位一件基础单品，"
                "自动补齐配套（缺下装补下装、缺鞋补鞋），返回一套完整穿搭，occasion 可约束风格（通勤/约会/运动/正式等）。"
            )
        )

    def get_definition(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer", "description": "用户ID（必填，由系统注入）"},
                        "query": {"type": "string", "description": "描述文字，如：黑色西装外套、碎花连衣裙"},
                        "item_id": {"type": "integer", "description": "指定参照单品 id（可选；与 query 二选一）"},
                        "top_k": {"type": "integer", "description": "相似款返回条数，默认 5"},
                        "completion_mode": {"type": "boolean", "default": False,
                                            "description": "true 时返回'配齐一套'：基础单品 + 自动补齐缺失类目（最多 3 件）"},
                        "occasion": {"type": "string",
                                     "description": "场合约束（可选）：通勤/约会/运动/正式/休闲/旅行/聚会"}
                    }
                }
            }
        }

    def _load_item(self, db, user_id: int, item_id: int):
        return db.query(ClothingItem).filter(
            ClothingItem.id == int(item_id), ClothingItem.user_id == user_id).first()

    def _query_vec(self, user_id: int, query: str, item_id):
        """获得查询向量：优先 item_id 图像向量，其次 query 文本向量"""
        if item_id:
            results = clothing_search.search_clothing([0.0], top_k=100, user_id=user_id)
            for r in results:
                if int(r["id"]) == int(item_id):
                    store = clothing_search._store()
                    vec = store.vectors.get(str(item_id))
                    if vec:
                        return vec
            # 未向量化：回退用文本
            db = SessionLocal()
            try:
                item = self._load_item(db, user_id, item_id)
            finally:
                db.close()
            if item:
                query = f"{item.name} {item.color or ''} {item.style or ''} {item.category}"
            else:
                return None, None
        if query:
            return ClothingEmbedder.embed_text(query), None
        return None, None

    def _search(self, user_id: int, query: str, top_k: int, category: str = None):
        """向量检索并过滤类目，返回 ClothingItem 列表（扩大候选保证每类都有命中）"""
        if not query:
            return []
        vec = ClothingEmbedder.embed_text(query)
        # 候选扩大：至少 20 条、最多 top_k*8，且放宽相似度阈值，保证过滤类目后仍有结果
        hits = clothing_search.search_clothing(
            vec, top_k=max(20, top_k * 8), user_id=user_id, min_score=0.05)
        db = SessionLocal()
        try:
            ids = [int(h["id"]) for h in hits]
            if not ids:
                return []
            items = db.query(ClothingItem).filter(ClothingItem.id.in_(ids)).all()
            by_id = {i.id: i for i in items}
            out = []
            for h in hits:
                it = by_id.get(int(h["id"]))
                if it and it.status != 'returned':
                    if category and it.category != category:
                        continue
                    out.append(it)
                if len(out) >= top_k:
                    break
            return out
        finally:
            db.close()

    def _color_to_hex(self, color_name: str):
        """中文色名 → HEX（反查表，支持子串匹配）"""
        from .outfit_scorer import color_to_hex
        return color_to_hex(color_name)

    def _hex_to_color_name(self, hex_str: str) -> str:
        """HEX → 最接近的中文色名（用 ΔE 遍历 COLOR_HEX 反查）"""
        from .outfit_scorer import COLOR_HEX, _hex_to_rgb, _delta_e2000
        best, best_de = None, 1e9
        for name, h in COLOR_HEX.items():
            try:
                de = _delta_e2000(_hex_to_rgb(hex_str), _hex_to_rgb(h))
            except Exception:
                continue
            if de < best_de:
                best, best_de = name, de
        return best if best_de < 25 else None

    def _needs_for(self, base_cat: str) -> list:
        """按基础单品类目推断缺失类目"""
        if base_cat in ('top', 'outer'):
            return ['bottom', 'shoes']
        if base_cat == 'bottom':
            return ['top', 'shoes']
        if base_cat == 'dress':
            return ['shoes']
        if base_cat == 'shoes':
            return ['top', 'bottom']
        if base_cat == 'accessory':
            return ['top', 'bottom']
        return ['bottom', 'shoes']

    def _rank_for_occasion(self, items, occasion: str) -> list:
        """按场合对候选排序（规则优先于纯 CLIP 相似度）：正式场合偏好西装裤/乐福鞋，运动偏好运动鞋"""
        if not items or not occasion:
            return items
        occ = str(occasion).lower()
        if occ in ('formal', 'business', '通勤', '正式'):
            def key(it):
                s = (it.style or '').lower()
                n = (it.name or '')
                bonus = 0
                if s in ('正式', 'formal', '商务'):
                    bonus += 100
                if '正式' in s or '西装' in s or '商务' in s:
                    bonus += 60
                if '西装裤' in n:
                    bonus += 80
                if '乐福' in n or '皮鞋' in n:
                    bonus += 70
                if '运动' in s or 'sport' in s:
                    bonus -= 40
                if '运动鞋' in n or 'sneaker' in n:
                    bonus -= 50
                return -bonus
            return sorted(items, key=key)
        if occ in ('sport', '运动', 'travel', '旅行'):
            def key2(it):
                s = (it.style or '').lower()
                n = (it.name or '')
                bonus = 0
                if '运动' in s or 'sport' in s or '休闲' in s:
                    bonus += 60
                if '运动鞋' in n or 'sneaker' in n:
                    bonus += 70
                if '乐福' in n or '西装裤' in n:
                    bonus -= 40
                return -bonus
            return sorted(items, key=key2)
        return items

    def execute(self, arguments: dict) -> str:
        try:
            user_id = int(arguments.get("user_id") or 0)
        except (TypeError, ValueError):
            user_id = 0
        if user_id <= 0:
            return json.dumps({"error": "缺少有效的 user_id"}, ensure_ascii=False)

        query = (arguments.get("query") or "").strip()
        item_id = arguments.get("item_id")
        top_k = max(1, min(10, int(arguments.get("top_k") or 5)))
        completion_mode = bool(arguments.get("completion_mode"))
        occasion = (arguments.get("occasion") or "").strip()

        # ---- 普通模式：原行为 ----
        query_vec, fallback_item = self._query_vec(user_id, query, item_id)
        if not completion_mode:
            if query_vec is None:
                return json.dumps({"error": "向量服务暂不可用，无法检索相似款"}, ensure_ascii=False)
            hits = clothing_search.search_clothing(query_vec, top_k=top_k, user_id=user_id)
            return self._format_hits(hits)

        # ---- 配齐一套模式 ----
        db = SessionLocal()
        try:
            base = None
            if item_id:
                base = self._load_item(db, user_id, item_id)
            if base is None and query:
                base = self._search(user_id, query, 1)[0] if self._search(user_id, query, 1) else None
        finally:
            db.close()

        if base is None:
            return json.dumps({"error": "未找到基础单品，无法配齐"}, ensure_ascii=False)

        needs = self._needs_for(base.category)
        base_color = base.color or ''
        # 互补色提示词（可选）：基础色 → 互补 hex → 中文色名
        comp_name = None
        hx = self._color_to_hex(base_color)
        if hx:
            try:
                from .color_tools import ColorHarmonyTool
                raw = ColorHarmonyTool().execute({"hex": hx, "type": "complementary"})
                data = json.loads(raw)
                if data.get("harmonies"):
                    comp_hex = data["harmonies"][0]["hex"]
                    comp_name = self._hex_to_color_name(comp_hex)
            except Exception:
                pass

        outfit = [{"id": base.id, "name": base.name, "category": base.category,
                   "color": base.color or "", "role": "基础单品",
                   "image_url": base.image_url or ""}]
        for cat in needs:
            color_hint = comp_name or base_color
            cat_cn = {'bottom': '下装', 'shoes': '鞋子', 'top': '上装', 'outer': '外套',
                      'dress': '连衣裙', 'accessory': '配饰'}.get(cat, cat)
            q = f"{color_hint} {cat_cn}"
            if occasion:
                q = f"{q} {occasion}"
            matched = self._search(user_id, q, 3, category=cat)
            if matched:
                matched = self._rank_for_occasion(matched, occasion)
                it = matched[0]
                outfit.append({"id": it.id, "name": it.name, "category": it.category,
                               "color": it.color or "", "role": cat_cn,
                               "image_url": it.image_url or ""})
            else:
                outfit.append({"role": cat_cn, "note": "未找到合适搭配（该类别缺少可匹配单品）"})

        return json.dumps({
            "completion_mode": True,
            "base": f"{base.name}（{base.category}）",
            "color_hint": comp_name or base_color,
            "outfit": outfit,
            "occasion": occasion or "不限",
        }, ensure_ascii=False)

    def _format_hits(self, hits) -> str:
        if not hits:
            return json.dumps({"items": [], "total": 0}, ensure_ascii=False)
        ids = [int(h["id"]) for h in hits]
        db = SessionLocal()
        try:
            items = db.query(ClothingItem).filter(ClothingItem.id.in_(ids)).all()
            by_id = {i.id: i for i in items}
            out = []
            for h in hits:
                it = by_id.get(int(h["id"]))
                if it:
                    out.append({
                        "id": it.id,
                        "name": it.name,
                        "category": it.category,
                        "color": it.color or "",
                        "style": it.style or "",
                        "similarity": round(h.get("score", 0), 3),
                        "image_url": it.image_url or "",
                    })
            return json.dumps({"items": out, "total": len(out)}, ensure_ascii=False)
        finally:
            db.close()
