import json
from ..tool_registry import Tool
from app.models import SessionLocal
from app.models.wardrobe import ClothingItem
from app.utils.llm_json import extract_json_object

CAT_CN = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰',
          'outer': '外套', 'dress': '连衣裙'}

REVIEW_PROMPT = (
    "用户搭配了一套服装，包含以下单品：\n{desc}\n\n"
    "请以专业服装搭配师的视角审核这套搭配：\n"
    "1. 色彩协调度；2. 季节是否合适；3. 场合是否得体；4. 完整性"
    "（下装可由「下装」或「连衣裙」其一提供；寒冷场景下「外套」可覆盖上装；"
    "2件及以上「上装」通常是有意叠穿应肯定层次感；鞋子与配饰为加分项；"
    "仅当明显缺失关键外层或上下装都没覆盖时才判为不完整）；\n"
    "5. 给出 1-10 评分；6. 给出 1-3 条具体可操作的改进建议。\n\n"
    "严格以如下 JSON 格式返回（不要 markdown 代码块包裹）：\n"
    '{"score": 8, "verdict": "优秀/合格/需改进", '
    '"color_comment": "...", "season_comment": "...", "occasion_comment": "...", '
    '"completeness_comment": "...", "suggestions": ["...", "..."]}'
)


class OutfitCheckTool(Tool):
    """真实搭配审核：把单品送入 DeepSeek 逐维度点评，返回结构化 JSON。"""

    def __init__(self):
        super().__init__(
            name="check_outfit",
            description="审核一套搭配是否协调：传入单品 id 列表（衣橱内）或衣物名称列表，返回评分/结论/各维度点评/改进建议。可选参数 occasion（场合）、season（季节）供模型结合判断。"
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
                        "items": {
                            "type": "array",
                            "items": {"type": ["integer", "string"]},
                            "description": "单品 id 列表（衣橱内）或衣物名称列表"
                        },
                        "occasion": {"type": "string", "description": "目标场合，如 通勤/约会/运动/正式"},
                        "season": {"type": "string", "description": "季节，如 春夏/秋冬"},
                    },
                    "required": ["user_id", "items"]
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        raw_items = arguments.get("items") or []
        if not isinstance(raw_items, list) or not raw_items:
            return json.dumps({"error": "请至少提供 2 件衣物"}, ensure_ascii=False)

        try:
            user_id = int(arguments.get("user_id") or 0)
        except (TypeError, ValueError):
            user_id = 0
        if user_id <= 0:
            return json.dumps({"error": "缺少有效的 user_id，无法审核搭配"}, ensure_ascii=False)

        # 解析单品：数字视为衣橱 id（需 user_id），字符串视为名称
        desc_lines = []
        numeric = all(isinstance(x, (int, float)) or (isinstance(x, str) and x.strip().isdigit()) for x in raw_items)
        db = SessionLocal()
        try:
            if numeric:
                ids = [int(x) for x in raw_items]
                items = db.query(ClothingItem).filter(
                    ClothingItem.user_id == user_id,
                    ClothingItem.id.in_(ids)
                ).all()
                if len(items) < 2:
                    return json.dumps({"error": "选中的衣物无效（至少需要 2 件且属于该用户）"}, ensure_ascii=False)
                for i in items:
                    desc_lines.append(
                        f"{i.name}（{CAT_CN.get(i.category, i.category)}，颜色：{i.color or '未知'}，"
                        f"风格：{i.style or '未知'}，季节：{i.season or '未知'}，场合：{i.occasion or '未知'}）"
                    )
            else:
                for name in raw_items:
                    desc_lines.append(str(name))
        finally:
            db.close()

        desc_text = "\n".join(desc_lines)
        prompt = REVIEW_PROMPT.replace("{desc}", desc_text)
        if arguments.get("occasion"):
            prompt += f"\n\n补充：目标场合为「{arguments['occasion']}」，请重点评估场合得体性。"
        if arguments.get("season"):
            prompt += f"\n\n补充：当前季节为「{arguments['season']}」，请重点评估季节适配性。"

        system = "你是一位经验丰富的专业服装搭配师，点评简洁、专业、有建设性。"
        try:
            from app.llm import get_llm_client
            resp = get_llm_client().chat([
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ])
            content = resp["choices"][0]["message"]["content"]
        except Exception as e:
            return json.dumps({"error": f"搭配审核调用失败：{e}"}, ensure_ascii=False)

        parsed = extract_json_object(content)
        if not parsed:
            return json.dumps({"error": "AI 返回格式异常", "raw": (content or "")[:1000]}, ensure_ascii=False)

        return json.dumps({
            "score": parsed.get("score"),
            "verdict": parsed.get("verdict"),
            "color_comment": parsed.get("color_comment", ""),
            "season_comment": parsed.get("season_comment", ""),
            "occasion_comment": parsed.get("occasion_comment", ""),
            "completeness_comment": parsed.get("completeness_comment", ""),
            "suggestions": parsed.get("suggestions", []) or [],
        }, ensure_ascii=False)
