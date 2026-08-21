import os
import re
import random
import time
from typing import List, Dict, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont


# 常见颜色 -> RGB
COLOR_MAP = {
    '白': (245, 245, 245),
    '黑': (30, 30, 30),
    '灰': (150, 150, 150),
    '蓝': (70, 130, 220),
    '浅蓝': (135, 206, 250),
    '藏青': (25, 42, 86),
    '卡其': (195, 176, 145),
    '棕': (139, 90, 43),
    '红': (220, 60, 60),
    '绿': (60, 160, 80),
    '黄': (255, 215, 0),
    '粉': (255, 192, 203),
    '紫': (147, 112, 219),
    '橙': (255, 165, 0),
}

CATEGORY_HINTS = {
    'top': ['上衣', '上装', 't恤', 't-shirt', '衬衫', '衬衣', '卫衣', '开衫', '毛衣', '针织衫'],
    'bottom': ['下装', '裤子', '牛仔裤', '西裤', '休闲裤', '长裤', '短裤', '裙'],
    'shoes': ['鞋', '运动鞋', '跑鞋', '乐福鞋', '皮鞋', '靴子', '帆布鞋'],
    'accessory': ['配饰', '帽子', '包', '眼镜', '腰带', '围巾', '首饰', '手表'],
    'outer': ['外套', '夹克', '大衣', '风衣', '棉服', '羽绒', '冲锋衣'],
    'dress': ['连衣裙', '裙子', '裙'],
}

# 拼贴图竖向堆叠顺序 & 中文标签（连衣裙可顶上下装，放在上装之后、下装之前）
CATEGORY_ORDER = ['outer', 'top', 'dress', 'bottom', 'shoes', 'accessory']
CATEGORY_LABEL = {
    'outer': '外套', 'top': '上装', 'dress': '连衣裙', 'bottom': '下装',
    'shoes': '鞋子', 'accessory': '配饰',
}


def _find_color_rgb(text: str) -> Tuple[int, int, int]:
    """从文本中找一个颜色，返回近似 RGB。"""
    for name, rgb in COLOR_MAP.items():
        if name in text:
            return rgb
    return (200, 200, 200)


def _score_item(text: str, item) -> int:
    """给每件衣物在推荐文本中的相关度打分。"""
    text = text.lower()
    score = 0
    # 名称匹配（每个字/词）
    name = item.name or ''
    for part in re.split(r'[\s\/\\+，,]+', name):
        if len(part) >= 2 and part.lower() in text:
            score += 8
        elif len(part) == 1 and part in text:
            score += 3
    # 颜色匹配
    color = item.color or ''
    if color and color in text:
        score += 6
    # 分类关键词匹配
    for hint in CATEGORY_HINTS.get(item.category, []):
        if hint in text:
            score += 4
    # 风格匹配
    style = item.style or ''
    if style and style in text:
        score += 2
    return score


def _pick_outfit_items(text: str, items: List) -> List[object]:
    """从衣橱中按推荐文本每个分类选最相关的一件，返回有序列表（支持外套/连衣裙等品类）。"""
    by_cat: Dict[str, List[Tuple[int, object]]] = {}
    for item in items:
        if getattr(item, 'status', 'confirmed') != 'confirmed':
            continue
        score = _score_item(text, item)
        if score <= 0:
            continue
        by_cat.setdefault(item.category, []).append((score, item))

    chosen: Dict[str, object] = {}
    for cat, scored in by_cat.items():
        scored.sort(key=lambda x: -x[0])
        chosen[cat] = scored[0][1]

    # 按固定品类顺序输出，其余品类追加在后
    ordered = [c for c in CATEGORY_ORDER if c in chosen] + \
              [c for c in chosen if c not in CATEGORY_ORDER]
    return [chosen[c] for c in ordered]


def _load_image(url_or_path: str, fallback_color=(220, 220, 220)) -> Image.Image:
    """加载图片；失败则返回纯色占位图。"""
    path = url_or_path
    if path.startswith('http://localhost:8000'):
        path = path.replace('http://localhost:8000', '')
    if path.startswith('/uploads/'):
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        path = os.path.join(base, path.lstrip('/'))

    try:
        img = Image.open(path).convert('RGBA')
        return img
    except Exception:
        img = Image.new('RGBA', (300, 300), fallback_color)
        return img


def _fit_image(img: Image.Image, box_w: int, box_h: int) -> Image.Image:
    """按比例缩放图片，使其完整放进 box 内（保留黑边/白边效果用背景填充）。"""
    iw, ih = img.size
    scale = min(box_w / iw, box_h / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    return img.resize((nw, nh), Image.Resampling.LANCZOS)


def _hex_color_for_item(item) -> Tuple[int, int, int]:
    """根据颜色名返回背景色。"""
    color = item.color or ''
    for name, rgb in COLOR_MAP.items():
        if name in color:
            return rgb
    return (230, 230, 230)


def _render_collage(
    items: List[object],
    filename_tag: str,
    title: str = 'AI 推荐搭配',
    base_url: str = 'http://localhost:8000',
) -> Optional[str]:
    """
    把一组衣物（支持同一品类多件，例如两件上装叠穿、或带外套）渲染成
    竖向堆叠的搭配拼贴图，保存到 uploads/，返回可访问 URL。
    items: 衣物对象列表（需有 category/name/image_url/color 属性）。
    若 items 为空，返回 None。
    """
    if not items:
        return None

    # 按品类分组并保持顺序：固定顺序优先，其余品类追加在后
    by_cat: Dict[str, List[object]] = {}
    for it in items:
        by_cat.setdefault(getattr(it, 'category', ''), []).append(it)

    cats_present = [c for c in CATEGORY_ORDER if c in by_cat] + \
                   [c for c in by_cat if c not in CATEGORY_ORDER]
    rows = [(c, by_cat[c]) for c in cats_present]
    if not rows:
        return None

    # 字体：优先用系统微软雅黑 / 苹方，否则用 Pillow 默认
    font_paths = [
        'C:/Windows/Fonts/msyh.ttc',
        'C:/Windows/Fonts/msyhbd.ttc',
        'C:/Windows/Fonts/simhei.ttf',
        '/System/Library/Fonts/PingFang.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    ]
    font = label_font = title_font = None
    for fp in font_paths:
        try:
            font = ImageFont.truetype(fp, 22)
            title_font = ImageFont.truetype(fp, 28)
            label_font = ImageFont.truetype(fp, 18)
            break
        except Exception:
            continue
    if font is None:
        font = title_font = label_font = ImageFont.load_default()

    header_h = 64
    footer_h = 44
    row_h = 172
    label_w = 96          # 左侧品类标签宽度
    canvas_w = 800
    canvas_h = header_h + len(rows) * row_h + footer_h
    # 浅蓝奶油系画布
    canvas = Image.new('RGB', (canvas_w, canvas_h), (253, 251, 247))
    draw = ImageDraw.Draw(canvas)

    # 色板
    C_HEADER = (122, 168, 255)   # #7aa8ff
    C_TEXT = (45, 58, 90)        # #2D3A5A
    C_SUB = (107, 122, 156)      # #6B7A9C
    C_BORDER = (214, 229, 255)   # #d6e5ff
    C_CARD_BG = (255, 255, 255)  # #ffffff

    # 标题栏
    draw.rectangle([0, 0, canvas_w, header_h], fill=C_HEADER)
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    draw.text(((canvas_w - tw) // 2, 16), title, fill=(255, 255, 255), font=title_font)

    for ri, (cat, its) in enumerate(rows):
        y0 = header_h + ri * row_h
        # 行分隔线（淡蓝）
        if ri > 0:
            draw.line([(20, y0), (canvas_w - 20, y0)], fill=C_BORDER, width=1)
        # 左侧品类标签：蓝色胶囊
        label = CATEGORY_LABEL.get(cat, cat)
        label_x0, label_y0 = 20, y0 + 18
        label_x1, label_y1 = label_x0 + 70, label_y0 + 34
        draw.rounded_rectangle([label_x0, label_y0, label_x1, label_y1], radius=17,
                               fill=C_HEADER)
        lb = draw.textbbox((0, 0), label, font=label_font)
        ltw = lb[2] - lb[0]
        lth = lb[3] - lb[1]
        draw.text((label_x0 + (70 - ltw) // 2, label_y0 + (34 - lth) // 2 - 2),
                  label, fill=(255, 255, 255), font=label_font)

        # 该品类下的单品横向并排（支持叠穿多件）
        m = len(its)
        area_x0 = 20 + label_w
        area_w = canvas_w - area_x0 - 20
        cell_w = area_w / m
        for ci, it in enumerate(its):
            cx = area_x0 + ci * cell_w
            box_x0, box_y0 = cx + 8, y0 + 12
            box_x1, box_y1 = cx + cell_w - 8, y0 + row_h - 32
            # 卡片白底 + 淡蓝边框，图片区用衣物颜色极淡 tint
            draw.rounded_rectangle([box_x0, box_y0, box_x1, box_y1], radius=14,
                                   fill=C_CARD_BG, outline=C_BORDER, width=2)
            img_bg = _hex_color_for_item(it)
            img_bg = tuple(min(255, int(c * 0.12 + 244)) for c in img_bg)
            img_area_margin = 10
            draw.rounded_rectangle(
                [box_x0 + img_area_margin, box_y0 + img_area_margin,
                 box_x1 - img_area_margin, box_y1 - 38],
                radius=10, fill=img_bg)
            img = _load_image(getattr(it, 'image_url', '') or '', _hex_color_for_item(it))
            img = _fit_image(img,
                             (box_x1 - box_x0) - img_area_margin * 2 - 20,
                             (box_y1 - box_y0) - img_area_margin * 2 - 50)
            iw, ih = img.size
            img_area_x0 = box_x0 + img_area_margin
            img_area_y0 = box_y0 + img_area_margin
            img_area_x1 = box_x1 - img_area_margin
            img_area_y1 = box_y1 - 38
            paste_x = int(img_area_x0 + ((img_area_x1 - img_area_x0) - iw) // 2)
            paste_y = int(img_area_y0 + ((img_area_y1 - img_area_y0) - ih) // 2)
            if img.mode == 'RGBA':
                canvas.paste(img, (paste_x, paste_y), img)
            else:
                canvas.paste(img, (paste_x, paste_y))
            name = getattr(it, 'name', None) or label
            nb = draw.textbbox((0, 0), name, font=label_font)
            nw = nb[2] - nb[0]
            draw.text((box_x0 + ((box_x1 - box_x0) - nw) // 2, box_y1 - 28), name,
                      fill=C_TEXT, font=label_font)

    # 底部说明
    footer = '根据你的衣橱单品自动组合生成'
    fb = draw.textbbox((0, 0), footer, font=label_font)
    fw = fb[2] - fb[0]
    draw.text(((canvas_w - fw) // 2, canvas_h - 30), footer, fill=C_SUB, font=label_font)

    # 保存（覆盖写入：同一标识只保留一张最新图，避免 uploads 目录无限堆积）
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(base_dir, 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'{filename_tag}.png'
    save_path = os.path.join(upload_dir, filename)
    canvas.save(save_path, 'PNG')

    # 返回带版本号(时间戳)的 URL，绕过浏览器对固定文件名的缓存
    import time
    return f'{base_url}/uploads/{filename}?v={int(time.time() * 1000)}'


def generate_outfit_collage(
    recommendation_text: str,
    items: List,
    conversation_id: int,
    base_url: str = 'http://localhost:8000',
    user_id: Optional[int] = None,
) -> Optional[str]:
    """
    根据推荐文本和衣橱单品生成搭配拼贴图，保存到 uploads/，返回可访问 URL。
    如果衣橱为空或没有匹配到任何单品，返回 None。
    使用 user_id 生成固定文件名并覆盖写入，避免 uploads 目录随每次对话无限堆积。
    """
    selected = _pick_outfit_items(recommendation_text, items)
    if not selected:
        return None
    tag = f'chat_outfit_{user_id}' if user_id else f'outfit_{conversation_id}'
    return _render_collage(selected, tag, 'AI 推荐搭配', base_url)


# ===================== 按天气/温度从衣橱直接挑衣 =====================

def _score_weather_item(item, cond: set) -> int:
    """根据天气条件给单品打分，分越高越适合今天穿。"""
    s = 0
    name = item.name or ''
    season = item.season or ''
    if 'hot' in cond:
        if any(k in name for k in ['t恤', '短袖', '衬衫', '衬衣', '吊带', '背心']):
            s += 3
    if 'cold' in cond:
        if any(k in name for k in ['开衫', '卫衣', '毛衣', '针织', '厚', '外套', '大衣', '夹克']):
            s += 3
    if 'cool' in cond:
        if any(k in name for k in ['衬衫', '卫衣', '开衫', '针织']):
            s += 1
    if 'rain' in cond or 'snow' in cond:
        if '乐福' in name or '皮鞋' in name:
            s -= 2
        if '运动鞋' in name or '靴' in name:
            s += 1
    if 'hot' in cond and '夏' in season:
        s += 1
    if 'cold' in cond and ('冬' in season or '秋' in season):
        s += 1
    if 'warm' in cond and '春' in season:
        s += 1
    return s


def pick_outfit_by_weather(items: List, temp: Optional[float] = None, weather_desc: str = '', random_pick: bool = False) -> Dict[str, object]:
    """
    根据温度 / 天气描述，从衣橱（仅 confirmed）里每个分类挑一件。
    支持外套(outer)与连衣裙(dress)：连衣裙可一并覆盖上装+下装。
    返回 {category: item | None}。random_pick=True 时在候选里随机选（用于「换一套」）。
    """
    cond = set()
    if temp is not None:
        if temp >= 28:
            cond.add('hot')
        elif temp >= 20:
            cond.add('warm')
        elif temp >= 12:
            cond.add('cool')
        else:
            cond.add('cold')
    if '雨' in weather_desc:
        cond.add('rain')
    if '雪' in weather_desc:
        cond.add('snow')

    cats = {'outer': [], 'top': [], 'dress': [], 'bottom': [], 'shoes': [], 'accessory': []}
    for it in items:
        if getattr(it, 'status', 'confirmed') != 'confirmed':
            continue
        if it.category in cats:
            cats[it.category].append(it)

    picked = {}
    for cat in ['outer', 'top', 'dress', 'bottom', 'shoes', 'accessory']:
        cands = cats[cat]
        if not cands:
            picked[cat] = None
            continue
        if random_pick:
            picked[cat] = random.choice(cands)
            continue
        best, best_s = cands[0], -999
        for it in cands:
            sc = _score_weather_item(it, cond)
            if sc > best_s:
                best, best_s = it, sc
        picked[cat] = best

    # 连衣裙覆盖上装+下装：若选了连衣裙，则不再单独显示上装/下装，避免冗余
    if picked.get('dress'):
        picked['top'] = None
        picked['bottom'] = None
    return picked


def build_outfit_text(picked: Dict[str, object], temp: Optional[float] = None, weather_desc: str = '', city: str = '') -> str:
    """生成今日穿搭的配文（含定位 + 天气 + 单品清单）。"""
    parts = [it.name for it in picked.values() if it]
    loc = (city + ' · ') if city else ''
    if temp is not None:
        wx = f'{temp:g}°C {weather_desc} '.strip() + ' '
    elif weather_desc:
        wx = weather_desc + ' '
    else:
        wx = ''
    if not parts:
        return f'📍 {loc}{wx}\n衣橱单品还不够，先去「衣橱」添加一些衣物吧～'
    return f'📍 {loc}{wx}\n为你搭配：' + ' + '.join(parts)


def outfit_from_wardrobe(
    items: List,
    temp: Optional[float] = None,
    weather_desc: str = '',
    tag: str = 'home',
    base_url: str = 'http://localhost:8000',
    random_pick: bool = False,
    city: str = '',
) -> Tuple[str, Optional[str], List[Dict]]:
    """
    按天气从衣橱挑一套搭配：返回 (配文 text, 拼贴图 URL, 单品列表)。
    tag 用于生成唯一文件名（如 f'home_{user_id}_{时间戳}'），避免浏览器缓存旧图。
    """
    picked = pick_outfit_by_weather(items, temp, weather_desc, random_pick)
    text = build_outfit_text(picked, temp, weather_desc, city)
    picked_items = [it for it in picked.values() if it]
    url = _render_collage(picked_items, tag, f'今日穿搭 · {weather_desc or "推荐"}', base_url) if picked_items else None
    item_list = [
        {'id': it.id, 'name': it.name, 'category': it.category, 'color': it.color, 'image_url': it.image_url}
        for it in picked.values() if it
    ]
    return text, url, item_list


if __name__ == '__main__':
    # 简单自测
    class FakeItem:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    items = [
        FakeItem(id=1, name='白色纯棉T恤', category='top', color='白色', style='休闲', status='confirmed', image_url='http://localhost:8000/uploads/item_1.png'),
        FakeItem(id=7, name='黑色西装裤', category='bottom', color='黑色', style='正式', status='confirmed', image_url='http://localhost:8000/uploads/item_7.png'),
        FakeItem(id=9, name='棕色乐福鞋', category='shoes', color='棕色', style='正式', status='confirmed', image_url='http://localhost:8000/uploads/item_9.png'),
        FakeItem(id=10, name='黑色棒球帽', category='accessory', color='黑色', style='休闲', status='confirmed', image_url='http://localhost:8000/uploads/item_10.png'),
    ]
    text = '推荐穿白色T恤，搭配黑色西装裤和棕色乐福鞋，再加一顶黑色棒球帽。'
    url = generate_outfit_collage(text, items, 999)
    print('generated:', url)
