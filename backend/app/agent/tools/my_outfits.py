import json
from ..tool_registry import Tool
from app.models import SessionLocal, Outfit, ClothingItem


class MyOutfitsTool(Tool):
    """读取当前用户已保存的套装，并把单品 id 解析为名称/品类，便于 AI 复用已有搭配。"""

    def __init__(self):
        super().__init__(
            name="get_my_outfits",
            description="读取当前用户已保存的套装（套装名、包含的单品名称与品类、说明）。"
                        "当用户想复用已有搭配、问『我之前存过什么搭配』『有没有适合的现成套装』时调用。"
                        "可选参数 limit（默认 10）限制返回条数。系统会自动注入当前用户。"
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
                        "limit": {
                            "type": "integer",
                            "description": "返回套装的最大条数，默认 10"
                        }
                    },
                    "required": []
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        user_id = arguments.get("user_id")
        if not user_id:
            return json.dumps({"error": "missing user_id"}, ensure_ascii=False)
        try:
            limit = int(arguments.get("limit", 10))
        except Exception:
            limit = 10
        db = SessionLocal()
        try:
            outfits = (
                db.query(Outfit)
                .filter(Outfit.user_id == user_id)
                .order_by(Outfit.created_at.desc())
                .limit(limit)
                .all()
            )
            # 收集全部单品 id，批量解析为名称/品类
            all_ids = []
            for o in outfits:
                try:
                    all_ids.extend(json.loads(o.item_ids or "[]"))
                except Exception:
                    pass
            items = {}
            if all_ids:
                for it in db.query(ClothingItem).filter(ClothingItem.id.in_(all_ids)).all():
                    items[it.id] = it

            result = []
            for o in outfits:
                try:
                    iids = json.loads(o.item_ids or "[]")
                except Exception:
                    iids = []
                members = []
                for iid in iids:
                    it = items.get(iid)
                    if it:
                        members.append({
                            "id": it.id,
                            "name": it.name,
                            "category": it.category,
                            "color": it.color,
                        })
                result.append({
                    "id": o.id,
                    "name": o.name,
                    "description": o.description or "",
                    "items": members,
                })
            return json.dumps({"count": len(result), "outfits": result}, ensure_ascii=False)
        finally:
            db.close()
