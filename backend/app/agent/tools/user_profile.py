import json
from ..tool_registry import Tool
from app.models import SessionLocal, User


class UserProfileTool(Tool):
    """读取当前用户的个人画像（身高/体重/肤色/体型/风格偏好/城市），让推荐贴合本人。"""

    def __init__(self):
        super().__init__(
            name="get_user_profile",
            description="读取当前登录用户的个人画像：身高(cm)、体重(kg)、肤色、体型、风格偏好、所在城市。"
                        "当用户询问『适合我吗』『显胖吗』『什么风格适合我』等需要结合本人条件的推荐时使用。"
                        "无需任何参数，系统会自动注入当前用户。"
        )

    def get_definition(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        user_id = arguments.get("user_id")
        if not user_id:
            return json.dumps({"error": "missing user_id"}, ensure_ascii=False)
        db = SessionLocal()
        try:
            u = db.query(User).filter(User.id == user_id).first()
            if not u:
                return json.dumps({"error": "user not found"}, ensure_ascii=False)
            data = {
                "nickname": u.nickname or "",
                "city": u.city or "",
                "height": u.height,
                "weight": u.weight,
                "skin_tone": u.skin_tone or "",
                "body_type": u.body_type or "",
                "style_preference": u.style_preference or "",
            }
            return json.dumps(data, ensure_ascii=False)
        finally:
            db.close()
