import json
import os
import sqlite3
from datetime import date, timedelta

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
UPLOAD = os.path.join(HERE, 'uploads')
DB = os.path.join(HERE, 'app.db')
SEED_JSON = os.path.join(HERE, 'wardrobe_seed.json')
os.makedirs(UPLOAD, exist_ok=True)

# (name, category, color_label, style, season, occasion, main_hex, bg_hex, shape)
items = [
    ('白色纯棉T恤', 'top', '白色', '休闲', '夏季', '日常', '#FFFFFF', '#F5F5F5', 'top'),
    ('黑色免烫衬衫', 'top', '黑色', '正式', '春秋', '通勤', '#2B2B2B', '#EFEFEF', 'top'),
    ('灰色连帽卫衣', 'top', '灰色', '休闲', '冬季', '日常', '#9E9E9E', '#ECECEC', 'top'),
    ('藏青针织开衫', 'top', '藏青', '休闲', '秋季', '日常', '#1F3A5F', '#EAEFF5', 'top'),
    ('浅蓝直筒牛仔裤', 'bottom', '蓝色', '休闲', '四季', '日常', '#5B7FBF', '#EAF0F8', 'bottom'),
    ('卡其休闲裤', 'bottom', '卡其', '休闲', '春夏', '日常', '#C3A572', '#F3EEE2', 'bottom'),
    ('黑色西装裤', 'bottom', '黑色', '正式', '四季', '通勤', '#2B2B2B', '#EDEDED', 'bottom'),
    ('白色运动鞋', 'shoes', '白色', '休闲', '四季', '运动', '#F2F2F2', '#F0F0F0', 'shoes'),
    ('棕色乐福鞋', 'shoes', '棕色', '正式', '春秋', '通勤', '#7B4B2A', '#F1E9E2', 'shoes'),
    ('黑色棒球帽', 'accessory', '黑色', '休闲', '夏季', '户外', '#1A1A1A', '#EDEDED', 'accessory'),
]


def load_seed(path):
    """若存在 wardrobe_seed.json，读取演示用的日期/次数配置。"""
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('items', {})


def hex2rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def draw_shape(d, shape, color, W, H):
    c = hex2rgb(color)
    cx = W // 2
    if shape == 'top':
        d.rectangle([cx - 70, 150, cx + 70, 400], fill=c, outline='#888')
        d.polygon([(cx - 70, 160), (cx - 130, 200), (cx - 120, 260), (cx - 70, 250)], fill=c, outline='#888')
        d.polygon([(cx + 70, 160), (cx + 130, 200), (cx + 120, 260), (cx + 70, 250)], fill=c, outline='#888')
        d.ellipse([cx - 25, 135, cx + 25, 165], fill=c, outline='#888')
    elif shape == 'bottom':
        d.rectangle([cx - 70, 150, cx - 10, 420], fill=c, outline='#888')
        d.rectangle([cx + 10, 150, cx + 70, 420], fill=c, outline='#888')
        d.rectangle([cx - 75, 140, cx + 75, 160], fill=c, outline='#888')
    elif shape == 'shoes':
        d.polygon([(cx - 110, 340), (cx + 90, 340), (cx + 110, 380), (cx - 110, 380)], fill=c, outline='#777')
        d.rectangle([cx - 110, 360, cx + 110, 385], fill=c, outline='#777')
        d.rectangle([cx - 115, 385, cx + 115, 402], fill='#333')
    elif shape == 'accessory':
        d.pieslice([cx - 80, 180, cx + 80, 340], 180, 360, fill=c, outline='#888')
        d.rectangle([cx - 110, 330, cx + 110, 347], fill=c, outline='#888')


def make_image(name, color, shape, bg, out):
    W, H = 400, 500
    img = Image.new('RGB', (W, H), hex2rgb(bg))
    d = ImageDraw.Draw(img)
    draw_shape(d, shape, color, W, H)
    d.rectangle([2, 2, W - 3, H - 3], outline='#DDD', width=2)
    try:
        f = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 22)
    except Exception:
        f = ImageFont.load_default()
    d.text((20, H - 60), name, fill='#333', font=f)
    img.save(out, 'PNG')


seed_cfg = load_seed(SEED_JSON)
conn = sqlite3.connect(DB)
cur = conn.cursor()
for i, (name, cat, color, style, season, occ, main, bg, shape) in enumerate(items, 1):
    fn = f'item_{i}.png'
    make_image(name, main, shape, bg, os.path.join(UPLOAD, fn))
    url = f'http://localhost:8000/uploads/{fn}'

    cfg = seed_cfg.get(str(i), {})
    today = date.today()
    purchase = (today - timedelta(days=cfg['purchase_days_ago'])).isoformat() if 'purchase_days_ago' in cfg else None
    last_worn = (today - timedelta(days=cfg['last_worn_days_ago'])).isoformat() if 'last_worn_days_ago' in cfg else None
    wear_count = cfg.get('wear_count', 0)

    cur.execute(
        """INSERT INTO clothing_items
           (user_id,name,category,color,style,season,occasion,image_url,status,purchase_date,last_worn,wear_count)
           VALUES (1,?,?,?,?,?,?,?,'confirmed',?,?,?)""",
        (name, cat, color, style, season, occ, url, purchase, last_worn, wear_count),
    )
    print('inserted', name, '->', url)
conn.commit()
print('total rows:', cur.execute('SELECT count(*) FROM clothing_items').fetchone()[0])
conn.close()
