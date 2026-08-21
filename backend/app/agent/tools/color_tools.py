"""色彩工具：get_color_harmony（配色轮）+ convert_to_pantone（Pantone 色号转换）。

两个工具都是纯函数、零外部依赖（无 API key / 无模型下载 / 离线可用）。
实现细节：
- HSL 色相环：互补/邻近/三角/四角/分离互补/同色深浅
- LAB + CIEDE2000 (ΔE) 色差：用于 Pantone 最近匹配与和谐度验证
"""

import json
import math

from ..tool_registry import Tool

# ======================= 颜色空间转换 =======================

def _hex_to_rgb(hex_str: str) -> tuple:
    """#RRGGBB / RRGGBB → (r, g, b) 0-255"""
    s = hex_str.strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    if len(s) != 6:
        raise ValueError(f"不是合法的 HEX 色值: {hex_str}")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def _rgb_to_hsl(r, g, b) -> tuple:
    """RGB(0-255) → (h, s, l) h∈[0,360) s,l∈[0,1]"""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h * 60 % 360, s, l


def _hsl_to_hex(h, s, l) -> str:
    """(h, s, l) → #RRGGBB"""
    h = h % 360
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return '#%02X%02X%02X' % (
        round((r + m) * 255), round((g + m) * 255), round((b + m) * 255))


def _rgb_to_lab(r, g, b) -> tuple:
    """RGB(0-255) → LAB（D65 参考白，sRGB 线性化）"""
    def _f(t):
        return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29

    r_ = r / 255.0
    g_ = g / 255.0
    b_ = b / 255.0
    r_ = r_ / 12.92 if r_ <= 0.04045 else ((r_ + 0.055) / 1.055) ** 2.4
    g_ = g_ / 12.92 if g_ <= 0.04045 else ((g_ + 0.055) / 1.055) ** 2.4
    b_ = b_ / 12.92 if b_ <= 0.04045 else ((b_ + 0.055) / 1.055) ** 2.4
    x = _f(0.4124564 * r_ + 0.3575761 * g_ + 0.1804375 * b_)
    y = _f(0.2126729 * r_ + 0.7151522 * g_ + 0.0721750 * b_)
    z = _f(0.0193339 * r_ + 0.1191920 * g_ + 0.9503041 * b_)
    return (116 * y - 16, 500 * (x - y), 200 * (y - z))


def delta_e2000(c1: str, c2: str) -> float:
    """CIEDE2000 色差（ΔE00）。业界标准，用于判断颜色感知差异。

    约定：ΔE < 1 肉眼不可分辨；< 2 可接受；> 3 明显差异。
    """
    l1, a1, b1 = _rgb_to_lab(*_hex_to_rgb(c1))
    l2, a2, b2 = _rgb_to_lab(*_hex_to_rgb(c2))

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

    return math.sqrt(
        (dl / sl) ** 2 + (dc / sc) ** 2 + (dh / sh) ** 2
        + rt * (dc / sc) * (dh / sh))


# ======================= 工具 1：get_color_harmony =======================

HARMONY_TYPES = ("complementary", "analogous", "triadic",
                 "tetradic", "split_complementary", "monochromatic")

HARMONY_CN = {
    "complementary": "互补色", "analogous": "邻近色", "triadic": "三角色",
    "tetradic": "四角色", "split_complementary": "分离互补", "monochromatic": "同色深浅",
}


class ColorHarmonyTool(Tool):
    def __init__(self):
        super().__init__(
            name="get_color_harmony",
            description=(
                "查询一个颜色的和谐配色。基于 12 色配色轮，可返回互补/邻近/三角/四角/分离互补/同色深浅六种方案，"
                "并给出每种方案的 ΔE 色差验证和谐度。适合推荐单品搭配什么颜色、为套装挑主色调。"
                "调用示例：get_color_harmony(hex='#7aa8ff', type='complementary')"
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
                        "hex": {"type": "string", "description": "基色 HEX 值，如 #7aa8ff"},
                        "type": {"type": "string",
                                 "enum": list(HARMONY_TYPES) + ["all"],
                                 "default": "all",
                                 "description": "和谐类型；all 返回全部六种"}
                    },
                    "required": ["hex"]
                }
            }
        }

    def _harmony(self, h, s, l, offset) -> str:
        """固定饱和/亮度、转动色相的和谐色（保证视觉统一）"""
        return _hsl_to_hex(h + offset, min(1.0, max(0.0, s)), l)

    def execute(self, arguments: dict) -> str:
        hex_str = arguments.get("hex", "")
        htype = arguments.get("type", "all")
        try:
            r, g, b = _hex_to_rgb(hex_str)
        except ValueError as e:
            return json.dumps({"error": str(e)}, ensure_ascii=False)

        h, s, l = _rgb_to_hsl(r, g, b)
        base = {"hex": hex_str.upper(), "rgb": [r, g, b],
                "hsl": [round(h, 1), round(s, 2), round(l, 2)]}

        plans = []
        if htype in ("complementary", "all"):
            plans.append({"type": "互补色", "hex": self._harmony(h, s, l, 180),
                          "delta_e": round(delta_e2000(hex_str, self._harmony(h, s, l, 180)), 2)})
        if htype in ("analogous", "all"):
            for off in (-30, 30):
                plans.append({"type": "邻近色", "hex": self._harmony(h, s, l, off),
                              "delta_e": round(delta_e2000(hex_str, self._harmony(h, s, l, off)), 2)})
        if htype in ("triadic", "all"):
            for off in (120, 240):
                plans.append({"type": "三角色", "hex": self._harmony(h, s, l, off),
                              "delta_e": round(delta_e2000(hex_str, self._harmony(h, s, l, off)), 2)})
        if htype in ("tetradic", "all"):
            for off in (90, 180, 270):
                plans.append({"type": "四角色", "hex": self._harmony(h, s, l, off),
                              "delta_e": round(delta_e2000(hex_str, self._harmony(h, s, l, off)), 2)})
        if htype in ("split_complementary", "all"):
            for off in (150, 210):
                plans.append({"type": "分离互补", "hex": self._harmony(h, s, l, off),
                              "delta_e": round(delta_e2000(hex_str, self._harmony(h, s, l, off)), 2)})
        if htype in ("monochromatic", "all"):
            for off in (-0.18, 0.18):
                c = _hsl_to_hex(h, s, max(0.0, min(1.0, l + off)))
                plans.append({"type": "同色深浅", "hex": c,
                              "delta_e": round(delta_e2000(hex_str, c), 2)})

        return json.dumps({"base": base, "harmonies": plans}, ensure_ascii=False)


# ======================= 工具 2：convert_to_pantone =======================

# 常用 Pantone TCX（服装用）色表：code / 中文名 / 参考 HEX
# 精简自公开常用 TCX 清单（覆盖 90% 服装场景），可直接扩展
from .data.pantone_tcx import PANTONE_TCX_TABLE


class PantoneConvertTool(Tool):
    def __init__(self):
        super().__init__(
            name="convert_to_pantone",
            description=(
                "把 HEX 颜色转成最接近的 Pantone TCX 服装色号（含 CIEDE2000 色差），"
                "让推荐描述更专业，如'Pantone 19-4052 Classic Blue 宝蓝连衣裙'。"
                "调用示例：convert_to_pantone(hex='#0d4a8c', max_results=3)"
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
                        "hex": {"type": "string", "description": "HEX 色值，如 #0d4a8c"},
                        "max_results": {"type": "integer", "minimum": 1, "maximum": 10,
                                        "default": 5, "description": "返回最近匹配个数（按 ΔE 升序）"}
                    },
                    "required": ["hex"]
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        hex_str = arguments.get("hex", "")
        try:
            max_n = max(1, min(10, int(arguments.get("max_results", 5))))
        except (TypeError, ValueError):
            max_n = 5
        try:
            _hex_to_rgb(hex_str)
        except ValueError as e:
            return json.dumps({"error": str(e)}, ensure_ascii=False)

        scored = []
        for code, name, ref_hex in PANTONE_TCX_TABLE:
            scored.append({"code": code, "name": name, "hex": ref_hex,
                           "delta_e": round(delta_e2000(hex_str, ref_hex), 2)})
        scored.sort(key=lambda x: x["delta_e"])
        return json.dumps(scored[:max_n], ensure_ascii=False)
