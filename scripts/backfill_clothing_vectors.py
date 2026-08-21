"""存量衣橱图片向量回填：为已存在的 ClothingItem 生成 CLIP 向量（供相似款检索）。

用法：cd backend && .venv/Scripts/python.exe ../scripts/backfill_clothing_vectors.py
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.models import SessionLocal
from app.models.wardrobe import ClothingItem
from app.vision.clothing_embedder import ClothingEmbedder
from app.services import clothing_search

if __name__ == "__main__":
    db = SessionLocal()
    try:
        store = clothing_search._store()
        items = db.query(ClothingItem).all()
        done = skip = fail = 0
        for it in items:
            if str(it.id) in store.vectors:
                skip += 1
                continue
            if not it.image_url:
                fail += 1
                continue
            name = it.image_url.rstrip('/').rsplit('/', 1)[-1]
            path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                 'backend', 'uploads', name)
            if not os.path.exists(path):
                print(f'  [missing] item {it.id} image not found: {path}')
                fail += 1
                continue
            with open(path, 'rb') as f:
                content = f.read()
            vec = ClothingEmbedder.embed_image(content)
            if vec:
                clothing_search.add_clothing_vector(it.id, vec, {
                    'user_id': it.user_id, 'name': it.name, 'category': it.category,
                    'color': it.color or '', 'style': it.style or '',
                })
                done += 1
            else:
                fail += 1
        print(f'backfill done: embedded={done} skipped={skip} failed={fail}')
    finally:
        db.close()
