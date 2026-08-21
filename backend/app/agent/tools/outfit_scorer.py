"""搭配规则评分工具：score_outfit_detailed（可解释规则评分）+ get_seasonal_suitability（季节适配评估）。

设计参考：
- FitMe / Microsoft AI_Agents_Hackathon #282：颜色优先级最高 + 款式 + 场合 + 温度
- ziggurat/fashion-assistant 的 style compatibility analyzer
- 风格评分 6 因子（颜色和谐/材质混合/比例/场合/季节/重复原则）

规则引擎纯本地计算、无 LLM 调用、可解释（每个维度返回分数与建议）。
"""

import json
import math

from ..tool_registry import Tool
from app.models import SessionLocal
from app.models.wardrobe import ClothingItem

# ======================= 常量与映射 =======================

CAT_CN = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰',
          'outer': '外套', 'dress': '连衣裙', 'bag': '包袋', 'hat': '帽子'}

# 颜色中文名 → HEX（与前端 COLOR_HEX 对齐，含常见后缀"系"）
COLOR_HEX = {
    '白色': '#F5F5F5', '白色系': '#F5F5F5', '米白': '#F5F0E1', '米白色': '#F5F0E1', '乳白': '#FAF3E8',
    '黑色': '#2B2B2B', '黑色系': '#2B2B2B',
    '灰色': '#9AA0A6', '灰色系': '#9AA0A6', '浅灰': '#C8C8C8', '深灰': '#5B5B5B',
    '红色': '#EF6F6C', '红色系': '#EF6F6C',
    '蓝色': '#5B8DEF', '蓝色系': '#5B8DEF', '宝蓝': '#0F4C81', '藏青': '#34406B', '浅蓝': '#A0C6E6',
    '绿色': '#22C1A8', '绿色系': '#22C1A8',
    '黄色': '#F6C244', '黄色系': '#F6C244',
    '粉色': '#F78FB3', '粉色系': '#F78FB3', '粉': '#F78FB3',
    '紫色': '#9B6DFF', '紫色系': '#9B6DFF', '薰衣草': '#C7B8D9',
    '棕色': '#A0713F', '棕色系': '#A0713F', '咖色': '#9B6D3F',
    '米色': '#E7D8BF', '米色系': '#E7D8BF', '卡其': '#C2A878', '卡其色': '#C2A878',
    '橙色': '#F6993A', '橙色系': '#F6993A', '珊瑚': '#FF9E8E', '珊瑚色': '#FF9E8E',
    '驼色': '#B58550', '酒红': '#8E2A3C', '橄榄': '#5C6A3C', '牛仔蓝': '#3B5A7C',
}

# 材质温度区间 [舒适下限℃, 舒适上限℃]（经验值）
MATERIAL_TEMP = {
    '棉': [10, 28], '纯棉': [10, 28], '麻': [18, 35], '亚麻': [18, 35],
    '丝': [15, 30], '丝绸': [15, 30], '毛': [-5, 18], '羊毛': [-5, 18],
    '羊绒': [-10, 12], '牛仔': [10, 25], '丹宁': [10, 25],
    '皮革': [5, 22], '皮': [5, 22], '聚酯': [12, 30], '化纤': [12, 30],
    '雪纺': [20, 35], '针织': [8, 20], '毛呢': [-5, 15], '呢子': [-5, 15],
}

# 季节平均气温（中国东部典型值，℃）
SEASON_TEMP = {'spring': 18, 'summer': 30, 'autumn': 18, 'winter': 6,
               '春': 18, '夏': 30, '秋': 18, '冬': 6,
               '春夏': 24, '秋冬': 12, '四季': 18, 'all': 18}

# 场合 → 期望的单品类别组合（category 多选）
OCCASION_RULES = {
    'business': {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    'formal':   {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    'casual':   {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    'sport':    {'top': ['top', 'outer'], 'bottom': ['bottom'], 'shoes': ['shoes']},
    'date':     {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    'travel':   {'top': ['top', 'outer'], 'bottom': ['bottom'], 'shoes': ['shoes']},
    'party':    {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    '通勤':      {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    '约会':      {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    '运动':      {'top': ['top', 'outer'], 'bottom': ['bottom'], 'shoes': ['shoes']},
    '正式':      {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    '休闲':      {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
    '旅行':      {'top': ['top', 'outer'], 'bottom': ['bottom'], 'shoes': ['shoes']},
    '聚会':      {'top': ['top', 'outer', 'dress'], 'bottom': ['bottom', 'dress'], 'shoes': ['shoes']},
}

# ======================= 颜色数学（复用 color_tools 的实现避免循环依赖） =======================

def _hex_to_rgb(hex_str):
    s = (hex_str or '').strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    if len(s) != 6:
        return None
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def _rgb_to_lab(r, g, b):
    def _f(t):
        return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29

    r_, g_, b_ = r / 255.0, g / 255.0, b / 255.0
    r_ = r_ / 12.92 if r_ <= 0.04045 else ((r_ + 0.055) / 1.055) ** 2.4
    g_ = g_ / 12.92 if g_ <= 0.04045 else ((g_ + 0.055) / 1.055) ** 2.4
    b_ = b_ / 12.92 if b_ <= 0.04045 else ((b_ + 0.055) / 1.055) ** 2.4
    x = _f(0.4124564 * r_ + 0.3575761 * g_ + 0.1804375 * b_)
    y = _f(0.2126729 * r_ + 0.7151522 * g_ + 0.0721750 * b_)
    z = _f(0.0193339 * r_ + 0.1191920 * g_ + 0.9503041 * b_)
    return (116 * y - 16, 500 * (x - y), 200 * (y - z))


def _delta_e2000(c1, c2):
    l1, a1, b1 = _rgb_to_lab(*c1)
    l2, a2, b2 = _rgb_to_lab(*c2)

    def _rad(x): return x * math.pi / 180
    def _deg(x): return x * 180 / math.pi

    c1s = math.hypot(a1, b1)
    c2s = math.hypot(a2, b2)
    mc = (c1s + c2s) / 2
    g = 0.5 * (1 - math.sqrt(mc ** 7 / (mc ** 7 + 25 ** 7)))
    a1p = (1 + g) * a1
    a2p = (1 + g) * a2
    c1p = math.hypot(a1p, b1)
    c2p = math.hypot(a2p, b2)
    h1p = _deg(math.atan2(b1, a1p)) % 360
    h2p = _deg(math.atan2(b2, a2p)) % 360

    dl = l2 - l1
    dc = c2p - c1p
    dh = 0.0
    if c1p * c2p != 0:
        dh = h2p - h1p
        if dh > 180:
            dh -= 360
        elif dh < -180:
            dh += 360
        dh = 2 * math.sqrt(c1p * c2p) * math.sin(_rad(dh) / 2)

    ml = (l1 + l2) / 2
    mc = (c1p + c2p) / 2
    mh = (h1p + h2p) / 2
    if abs(h1p - h2p) > 180:
        mh += 360
    mh /= 2
    t = (1 - 0.17 * math.cos(_rad(mh - 30)) + 0.24 * math.cos(_rad(2 * mh))
         + 0.32 * math.cos(_rad(3 * mh + 6)) - 0.20 * math.cos(_rad(4 * mh - 63)))
    sl = 1 + 0.015 * (ml - 50) ** 2 / math.sqrt(20 + (ml - 50) ** 2)
    sc = 1 + 0.045 * mc
    sh = 1 + 0.015 * mc * t
    rt = -2 * math.sqrt(mc ** 7 / (mc ** 7 + 25 ** 7)) * math.sin(
        _rad(60 * math.exp(-((mh - 275) / 25) ** 2)))
    return math.sqrt((dl / sl) ** 2 + (dc / sc) ** 2 + (dh / sh) ** 2
                     + rt * (dc / sc) * (dh / sh))


def color_to_hex(color_name: str):
    """中文颜色名 → HEX；无映射返回 None"""
    if not color_name:
        return None
    c = color_name.strip()
    if c in COLOR_HEX:
        return COLOR_HEX[c]
    # 尝试去掉"系"再查
    if c.endswith('系') and c[:-1] in COLOR_HEX:
        return COLOR_HEX[c[:-1]]
    # 尝试取第一个字（如"浅蓝色"→"浅蓝"→"蓝色"）
    for k, v in COLOR_HEX.items():
        if k in c or c in k:
            return v
    return None


# ======================= 数据访问 =======================

def _resolve_items(user_id: int, items: list):
    """把工具入参（id 或名称）解析成 ClothingItem 列表"""
    if not items:
        return []
    db = SessionLocal()
    try:
        result = []
        for it in items:
            if it is None:
                continue
            s = str(it).strip()
            q = db.query(ClothingItem).filter(ClothingItem.user_id == user_id)
            if s.isdigit():
                row = q.filter(ClothingItem.id == int(s)).first()
            else:
                row = q.filter(ClothingItem.name == s).first() \
                    or q.filter(ClothingItem.name.like(f'%{s}%')).first()
            if row and row.status != 'returned':
                result.append(row)
        return result
    finally:
        db.close()


# ======================= 维度评分 =======================

def _score_color_harmony(items, occasion) -> tuple:
    """颜色和谐（25 分制）：主色（上装/外套/连衣裙）与辅色（下装）ΔE2000 检验

    中性色（白/黑/灰/米/卡其/驼）与任何颜色都百搭，直接豁免撞色判断。
    """
    if not items:
        return 0, ["没有可评分的单品"]
    colors = [(it.name, it.color) for it in items if it.color]
    hexes = [(n, color_to_hex(c)) for n, c in colors if color_to_hex(c)]
    if not hexes:
        return 18, ["缺少颜色信息，无法精确评分（按中性给分）"]

    # 主色=上装/外套/连衣裙第一件；辅色=下装/鞋第一件
    main_hex = None
    sub_hex = None
    main_name = ''
    sub_name = ''
    for it in items:
        h = color_to_hex(it.color)
        if not h:
            continue
        if it.category in ('top', 'outer', 'dress') and main_hex is None:
            main_hex, main_name = h, it.color
        elif it.category in ('bottom', 'shoes') and sub_hex is None:
            sub_hex, sub_name = h, it.color

    NEUTRAL = ('白', '黑', '灰', '米', '卡其', '驼', '乳')
    score = 18
    notes = []
    if main_hex and sub_hex:
        main_neutral = any(k in main_name for k in NEUTRAL)
        sub_neutral = any(k in sub_name for k in NEUTRAL)
        if main_neutral or sub_neutral:
            score = 23
            notes.append(f"含中性色（{main_name}/{sub_name}），与任何颜色都百搭")
        else:
            de = _delta_e2000(_hex_to_rgb(main_hex), _hex_to_rgb(sub_hex))
            if de < 3:
                score = 16
                notes.append(f"主色与辅色太接近（ΔE {de:.1f}），整体偏单调")
            elif de <= 12:
                score = 24
                notes.append(f"主色与辅色和谐（ΔE {de:.1f}）")
            elif de <= 20:
                score = 20
                notes.append(f"主色与辅色有一定对比（ΔE {de:.1f}），可接受")
            else:
                # 撞色：正式/通勤场合扣分，派对/约会放宽
                score = 17 if occasion in ('formal', 'business', '通勤', '正式') else 21
                notes.append(f"主色与辅色对比强烈（ΔE {de:.1f}）" +
                             ("，正式场合建议收敛" if score == 17 else "，适合个性场合"))
    else:
        notes.append("颜色信息不足，未能精确校验")

    # 多样性惩罚：超过 3 种差异大的颜色显杂乱
    unique = set(hexes)
    if len(unique) >= 4:
        score = max(12, score - 4)
        notes.append("颜色种类偏多（4+），建议控制在 3 色以内")
    return max(0, min(25, score)), notes


def _score_material_mix(items) -> tuple:
    """材质丰富度（15 分制）：2-3 种材质最佳"""
    mats = set()
    for it in items:
        m = (it.material or '').strip()
        if m:
            mats.add(m)
    if not mats:
        return 13, ["缺少材质信息（按中性给分）"]
    n = len(mats)
    if 2 <= n <= 3:
        return 15, [f"材质组合丰富（{n} 种）"]
    if n == 1:
        return 11, ["材质较单一，可尝试混搭一种不同材质"]
    return 13, [f"材质偏多（{n} 种），注意不要杂乱"]


def _score_proportion(items) -> tuple:
    """视觉比例/完整性（20 分制）：上装+下装+鞋是基础闭环"""
    cats = [it.category for it in items]
    score = 20
    notes = []
    has_top = any(c in ('top', 'outer', 'dress') for c in cats)
    has_bottom = any(c in ('bottom', 'dress') for c in cats)
    has_shoes = 'shoes' in cats
    if not has_top:
        score -= 8
        notes.append("缺少上装或外套")
    if not has_bottom:
        score -= 10
        notes.append("缺少下装（或连衣裙）")
    if not has_shoes:
        score -= 5
        notes.append("缺少鞋子")
    if not notes:
        notes.append("上装/下装/鞋齐全，比例完整")
    return max(0, score), notes


def _score_occasion(items, occasion) -> tuple:
    """场合匹配（25 分制）：类目闭环 + 常见风格/颜色偏好"""
    if not occasion:
        return 20, ["未指定场合（按中性给分）"]
    rule = OCCASION_RULES.get(occasion)
    if not rule:
        return 20, [f"未知场合「{occasion}」（按中性给分）"]
    cats = [it.category for it in items]
    score = 25
    notes = []
    # 基础：类目齐全
    miss = []
    for role, allowed in rule.items():
        if not any(c in allowed for c in cats):
            miss.append({'business': '上衣', 'formal': '上衣', 'casual': '上衣', 'sport': '运动上衣',
                         'date': '上衣', 'travel': '上衣', 'party': '上衣'}.get(role, role))
    if miss:
        score -= 6 * len(miss)
        notes.append(f"缺少{'、'.join(miss)}")

    # 风格偏好：商务/正式 排斥运动鞋与亮色运动装
    if occasion in ('business', 'formal', '通勤', '正式'):
        for it in items:
            if it.category == 'shoes' and (it.style or '').lower() in ('sport', '运动', 'sneaker', '休闲'):
                score -= 4
                notes.append(f"「{it.name}」偏休闲，正式场合建议换皮鞋/乐福鞋")
    if occasion in ('sport', '运动', 'travel', '旅行'):
        for it in items:
            if it.category == 'shoes' and not (it.style or '').lower() in ('sport', '运动', 'sneaker'):
                score -= 3
                notes.append(f"「{it.name}」不是运动鞋，运动场景可能不便")
    if not notes:
        notes.append(f"符合「{occasion}」场合的基本要求")
    return max(0, min(25, score)), notes


def _score_season(items, season) -> tuple:
    """季节匹配（10 分制）：材质温度区间 vs 季节均温"""
    if not season or season in ('all', '四季'):
        return 8, ["未限定季节（按中性给分）"]
    temp = SEASON_TEMP.get(str(season).lower())
    if temp is None:
        return 8, [f"未知季节「{season}」"]
    score = 10
    notes = []
    for it in items:
        m = (it.material or '').strip()
        lo, hi = None, None
        for k, (l_, h_) in MATERIAL_TEMP.items():
            if m and (k in m or m in k):
                lo, hi = l_, h_
                break
        if lo is None:
            # fallback：用衣物的 season 标注（如"夏季"/"冬季"）
            iseason = (it.season or '').replace('季', '')
            item_temp = SEASON_TEMP.get(iseason)
            if item_temp is not None:
                suit = 10 - max(0, abs(item_temp - temp) / 12) * 6
                if suit < 8:
                    score -= 2
                    notes.append(f"「{it.name}」标注{it.season}，与当前{temp}℃季节不搭")
            continue
        if temp < lo:
            score -= 2
            notes.append(f"「{it.name}」（{m}）在{temp}℃偏冷，建议换保暖材质")
        elif temp > hi:
            score -= 2
            notes.append(f"「{it.name}」（{m}）在{temp}℃偏热，建议换透气材质")
    if not notes:
        notes.append("材质与当前季节温度匹配")
    return max(0, score), notes


def _score_repetition(items) -> tuple:
    """重复原则（5 分制）：同色/同材质重复惩罚"""
    score = 5
    notes = []
    colors = [it.color for it in items if it.color]
    mats = [it.material for it in items if it.material]
    from collections import Counter
    for k, v in Counter(colors).items():
        if v >= 3:
            score -= 2
            notes.append(f"「{k}」出现 {v} 次过多")
    for k, v in Counter(mats).items():
        if v >= 4:
            score -= 1
            notes.append(f"「{k}」材质重复过多")
    if not notes:
        notes.append("色彩与材质重复度合理")
    return max(0, score), notes


# ======================= 工具 1：score_outfit_detailed =======================

class OutfitScorerTool(Tool):
    def __init__(self):
        super().__init__(
            name="score_outfit_detailed",
            description=(
                "对一套搭配做可解释规则评分（0-100）：颜色和谐 25 / 场合匹配 25 / 视觉比例 20 / 材质丰富 15 / 季节匹配 10 / 重复原则 5。"
                "每个维度返回分数与具体建议，比纯 LLM 评分稳定可解释。传入单品 id 或名称列表（衣橱内）。"
                "调用示例：score_outfit_detailed(items=['衬衫','卡其裤'], occasion='通勤', season='春秋')"
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
                        "items": {"type": "array", "items": {"type": ["integer", "string"]},
                                  "description": "单品 id 列表或名称列表（衣橱内）"},
                        "occasion": {"type": "string", "description": "场合：通勤/约会/运动/正式/休闲/旅行/聚会 或英文"},
                        "season": {"type": "string", "description": "季节：春/夏/秋/冬/春夏/秋冬 或 spring/summer/all"}
                    },
                    "required": ["user_id", "items"]
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        try:
            user_id = int(arguments.get("user_id", 0) or 0)
        except (TypeError, ValueError):
            user_id = 0
        items = arguments.get("items") or []
        occasion = arguments.get("occasion") or ""
        season = arguments.get("season") or ""

        rows = _resolve_items(user_id, items)
        if not rows:
            return json.dumps({"error": "未找到这些单品（可能不属于当前用户或已删除）"}, ensure_ascii=False)

        dims = {
            'color_harmony': _score_color_harmony(rows, occasion),
            'occasion': _score_occasion(rows, occasion),
            'proportion': _score_proportion(rows),
            'material_mix': _score_material_mix(rows),
            'season': _score_season(rows, season),
            'repetition': _score_repetition(rows),
        }
        weights = {'color_harmony': 25, 'occasion': 25, 'proportion': 20,
                   'material_mix': 15, 'season': 10, 'repetition': 5}

        total = sum(dims[k][0] / 25 * weights[k] for k in weights)
        detail = {k: {'score': v[0], 'max': 25, 'weight': weights[k],
                      'note': v[1]} for k, v in dims.items()}

        verdict = '优秀' if total >= 85 else ('合格' if total >= 70 else '需改进')
        suggestions = []
        for k in ('occasion', 'color_harmony', 'proportion', 'season', 'material_mix', 'repetition'):
            for note in dims[k][1]:
                if note.startswith(('缺少', '「', '颜色', '材质', '主色')):
                    suggestions.append(note)
        suggestions = suggestions[:4] or ['整体搭配不错，继续保持']

        return json.dumps({
            'total_score': round(total, 1),
            'verdict': verdict,
            'dimensions': detail,
            'suggestions': suggestions,
            'items': [{'id': it.id, 'name': it.name,
                       'category': CAT_CN.get(it.category, it.category),
                       'color': it.color, 'material': it.material} for it in rows]
        }, ensure_ascii=False)


# ======================= 工具 2：get_seasonal_suitability =======================

class SeasonalTool(Tool):
    def __init__(self):
        super().__init__(
            name="get_seasonal_suitability",
            description=(
                "评估一组衣物的季节穿着舒适度（0-100）：结合材质温度区间与当前城市气温或指定季节均温，"
                "返回是否合适与逐件改进建议。调用示例：get_seasonal_suitability(items=['羊毛大衣'], season='夏', city='泉州')"
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
                        "items": {"type": "array", "items": {"type": ["integer", "string"]},
                                  "description": "单品 id 或名称列表（衣橱内）"},
                        "season": {"type": "string", "default": "current",
                                   "description": "春/夏/秋/冬 或 spring/summer/all；current 表示结合城市实时气温"},
                        "city": {"type": "string", "description": "城市名（season=current 时用于实时温度，可选）"}
                    },
                    "required": ["user_id", "items"]
                }
            }
        }

    def _get_temp(self, season: str, city: str):
        """season=current 时尝试取城市实时温度，否则用季节均温"""
        if str(season).lower() == 'current' and city:
            try:
                from app.agent.tools.weather import WeatherTool
                raw = WeatherTool().execute({"city": city, "date": "今天"})
                data = json.loads(raw)
                t = data.get("temperature")
                if t is not None:
                    return float(t), f"{city}实时 {t}℃"
            except Exception:
                pass
        temp = SEASON_TEMP.get(str(season).lower())
        if temp is not None:
            return float(temp), f"季节均温 {temp}℃"
        # 兜底：当前季节由月份推断
        import datetime
        month = datetime.datetime.now().month
        guess = {3: 18, 4: 22, 5: 26, 6: 30, 7: 33, 8: 33, 9: 26, 10: 20, 11: 14, 12: 8}[month]
        return float(guess), f"按当前月份估算 {guess}℃"

    def execute(self, arguments: dict) -> str:
        try:
            user_id = int(arguments.get("user_id", 0) or 0)
        except (TypeError, ValueError):
            user_id = 0
        items = arguments.get("items") or []
        season = arguments.get("season") or "current"
        city = arguments.get("city") or ""

        rows = _resolve_items(user_id, items)
        if not rows:
            return json.dumps({"error": "未找到这些单品"}, ensure_ascii=False)

        temp, temp_desc = self._get_temp(season, city)
        scores, advice = [], []
        for it in rows:
            m = (it.material or '').strip()
            lo, hi = None, None
            for k, (l_, h_) in MATERIAL_TEMP.items():
                if m and (k in m or m in k):
                    lo, hi = l_, h_
                    break
            if lo is None:
                # fallback：用衣物的 season 标注（如"夏季"→夏）
                iseason = (it.season or '').replace('季', '')
                item_temp = SEASON_TEMP.get(iseason)
                if item_temp is not None:
                    suit = max(0, min(100, 100 - abs(item_temp - temp) * 2.2))
                    scores.append(suit)
                    if suit < 60:
                        advice.append(f"「{it.name}」标注{it.season}，与当前 {temp}℃ 环境不符")
                continue
            mid = (lo + hi) / 2
            suit = max(0, min(100, 100 - abs(mid - temp) * 2.2))
            scores.append(suit)
            if suit < 60:
                need = '保暖' if temp < lo else '透气'
                advice.append(f"「{it.name}」（{m}）在 {temp}℃ 偏{'冷' if temp < lo else '热'}，建议换{need}单品")

        if not scores:
            return json.dumps({
                'avg_score': 50.0, 'temperature': temp, 'temp_desc': temp_desc,
                'recommendation': '缺少材质信息，无法评估',
                'suggestions': ['给衣物补充材质信息可获得更准评估']
            }, ensure_ascii=False)

        avg = round(sum(scores) / len(scores), 1)
        return json.dumps({
            'avg_score': avg,
            'temperature': temp,
            'temp_desc': temp_desc,
            'recommendation': '合适' if avg >= 75 else ('勉强' if avg >= 60 else '不合适'),
            'suggestions': advice or ['材质与当前温度匹配，穿着舒适']
        }, ensure_ascii=False)
