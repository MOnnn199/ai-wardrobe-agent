import json
from ..tool_registry import Tool
from app.models import SessionLocal
from app.models.wardrobe import ClothingItem

# 类别中英文映射（与 user.py 保持一致）
CAT_CN = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰',
          'outer': '外套', 'dress': '连衣裙'}


class WardrobeTool(Tool):
    """查询用户真实衣橱（读数据库），支持按类别/季节/场合筛选。"""

    def __init__(self):
        super().__init__(
            name="get_wardrobe",
            description="查询指定用户的真实衣橱（读数据库）。可按类别(category: top/bottom/shoes/accessory/outer/dress)、季节(season)、场合(occasion)筛选；不传筛选条件时返回全部已确认衣物。"
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
                        "category": {"type": "string", "description": "筛选类别，可选：top/bottom/shoes/accessory/outer/dress"},
                        "season": {"type": "string", "description": "筛选季节，如 春夏/秋冬"},
                        "occasion": {"type": "string", "description": "筛选场合，如 正式/休闲/运动"},
                    },
                    "required": ["user_id"]
                }
            }
        }

    def _item_to_dict(self, i: ClothingItem) -> dict:
        raw_tags = getattr(i, "tags", "") or ""
        try:
            tags = json.loads(raw_tags) if raw_tags else []
        except Exception:
            tags = []
        return {
            "id": i.id,
            "name": i.name,
            "category": i.category,
            "category_cn": CAT_CN.get(i.category, i.category),
            "color": i.color or "",
            "style": i.style or "",
            "material": getattr(i, "material", "") or "",
            "pattern": getattr(i, "pattern", "") or "",
            "season": i.season or "",
            "occasion": i.occasion or "",
            "tags": tags,
            "image_url": i.image_url or "",
            "wear_count": i.wear_count or 0,
        }

    def execute(self, arguments: dict) -> str:
        try:
            user_id = int(arguments.get("user_id") or 0)
        except (TypeError, ValueError):
            user_id = 0
        if user_id <= 0:
            return json.dumps({"error": "缺少有效的 user_id，无法查询衣橱"}, ensure_ascii=False)

        db = SessionLocal()
        try:
            q = db.query(ClothingItem).filter(
                ClothingItem.user_id == user_id,
                ClothingItem.status == 'confirmed',
            )
            category = (arguments.get("category") or "").strip()
            if category:
                q = q.filter(ClothingItem.category == category)
            season = (arguments.get("season") or "").strip()
            if season:
                q = q.filter(ClothingItem.season == season)
            occasion = (arguments.get("occasion") or "").strip()
            if occasion:
                q = q.filter(ClothingItem.occasion == occasion)

            items = [self._item_to_dict(i) for i in q.order_by(ClothingItem.created_at.desc()).all()]
            return json.dumps({"user_id": user_id, "items": items, "total": len(items)},
                              ensure_ascii=False)
        except Exception as e:
            return json.dumps({"error": f"查询衣橱失败：{e}"}, ensure_ascii=False)
        finally:
            db.close()
