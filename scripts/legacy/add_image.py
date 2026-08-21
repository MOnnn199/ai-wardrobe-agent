import os

path = r'E:\ai-wardrobe-agent\backend\app\api\user.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

add_ep = """
@router.post('/analyze-image')
async def analyze_image(file: UploadFile = File(...)):
    import uuid, os as fse, base64
    upload_dir = 'uploads/temp'
    fse.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f'{uuid.uuid4()}.{ext}'
    path = f'{upload_dir}/{filename}'
    content = await file.read()
    with open(path, 'wb') as f:
        f.write(content)

    b64 = base64.b64encode(content).decode('utf-8')
    from app.llm.tongyi_vl import TongyiVLClient
    client = TongyiVLClient()
    prompt = '请详细描述这张图片中的衣物：类别（上装/下装/鞋子/配饰）、颜色、风格、适合的季节和场合。以JSON格式返回。'
    result = client.analyze_image(b64, prompt)
    return {'image_url': f'/{path}', 'analysis': result}


@router.post('/wardrobe/upload-and-tag')
async def upload_and_tag(file: UploadFile = File(...), user_id: int = 1, db: Session = Depends(get_db)):
    import uuid, os as fse, base64, json
    upload_dir = 'uploads/wardrobe'
    fse.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f'{uuid.uuid4()}.{ext}'
    path = f'{upload_dir}/{filename}'
    content = await file.read()
    with open(path, 'wb') as f:
        f.write(content)

    b64 = base64.b64encode(content).decode('utf-8')
    from app.llm.tongyi_vl import TongyiVLClient
    client = TongyiVLClient()
    prompt = (
        '你是一个专业的服装识别系统。请分析这张图片中的衣物，返回严格的JSON格式（不要markdown包裹）：'
        '{"name": "衣物名称", "category": "top/bottom/shoes/accessory", '
        '"color": "主要颜色", "style": "风格描述", "season": "春夏/秋冬", "occasion": "正式/休闲/运动"}'
    )
    result = client.analyze_image(b64, prompt)

    try:
        clean = result.strip()
        if clean.startswith('```'):
            clean = clean.split('\\n', 1)[-1]
            clean = clean.rsplit('\\n```', 1)[0]
        if '{' in clean and '}' in clean:
            clean = clean[clean.index('{'):clean.rindex('}')+1]
        tags = json.loads(clean)
    except:
        tags = {'name': file.filename, 'category': 'top', 'color': '', 'style': '', 'season': '', 'occasion': ''}

    from app.models.wardrobe import ClothingItem
    item = ClothingItem(
        user_id=user_id,
        name=tags.get('name', file.filename),
        category=tags.get('category', 'top'),
        color=tags.get('color', ''),
        style=tags.get('style', ''),
        season=tags.get('season', ''),
        occasion=tags.get('occasion', ''),
        image_url=f'/{path}',
        status='confirmed'
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {'item': item, 'tags': tags}
"""

content = content.rstrip() + '\n' + add_ep.strip() + '\n'

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Added image endpoints')