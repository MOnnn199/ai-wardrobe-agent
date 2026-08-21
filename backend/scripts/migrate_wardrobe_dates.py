"""
给 clothing_items 表补充时间维度字段，并从 wardrobe_seed.json 读取演示数据填充。

- 配置文件中前 4 件为闲置旧衣（购入 300~520 天前，最后穿着 110~200 天前，穿过 2~6 次）
- 后 6 件为活跃衣物（购入 25~150 天前，最后穿着 1~30 天前，穿过 12~45 次）

真实环境应由用户上传/录入时维护 purchase_date / last_worn / wear_count，
不要修改本脚本中的演示配置作为生产数据。

运行：backend/.venv/Scripts/python.exe scripts/migrate_wardrobe_dates.py
"""
import json
import os
import sqlite3
from datetime import date, timedelta

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(BASE, 'app.db')
SEED_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wardrobe_seed.json')


def load_seed(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f'缺少演示配置文件: {path}')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('items', {})


def main():
    c = sqlite3.connect(DB)
    cur = c.cursor()

    # 1) 加列（已存在则跳过）
    for col, typ in [('purchase_date', 'DATE'), ('last_worn', 'DATE'), ('wear_count', 'INTEGER')]:
        try:
            cur.execute(f'ALTER TABLE clothing_items ADD COLUMN {col} {typ}')
            print('added column', col)
        except sqlite3.OperationalError:
            pass  # 已存在

    # 2) 从配置文件读取并填充日子
    seed = load_seed(SEED_JSON)
    today = date.today()
    updated = 0
    for sid, cfg in seed.items():
        iid = int(sid)
        purchase = today - timedelta(days=cfg['purchase_days_ago'])
        last_worn = today - timedelta(days=cfg['last_worn_days_ago'])
        cnt = cfg['wear_count']
        cur.execute(
            'UPDATE clothing_items SET purchase_date=?, last_worn=?, wear_count=? WHERE id=?',
            (purchase.isoformat(), last_worn.isoformat(), cnt, iid)
        )
        updated += cur.rowcount
    c.commit()

    # 3) 回显
    print(f'updated {updated} rows from {SEED_JSON}')
    for row in cur.execute('SELECT id,name,purchase_date,last_worn,wear_count FROM clothing_items ORDER BY id'):
        print(row)
    c.close()


if __name__ == '__main__':
    main()
