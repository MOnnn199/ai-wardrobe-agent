import os
import requests
from dotenv import load_dotenv

load_dotenv(encoding='utf-8-sig')

# 模型缓存放到 E 盘，避免落到 C 盘（用户偏好）
U2NET_HOME = os.environ.get('U2NET_HOME') or 'E:/models/rembg'
os.environ['U2NET_HOME'] = U2NET_HOME
os.makedirs(U2NET_HOME, exist_ok=True)

LOCAL_MODEL_PATH = os.path.join(U2NET_HOME, 'models', 'bria-rmbg', 'bria-rmbg.onnx')


def _remove_bg_api(input_bytes: bytes, api_key: str) -> bytes | None:
    """调用 remove.bg 在线 API 抠图，返回透明 PNG 字节。"""
    try:
        r = requests.post(
            'https://api.remove.bg/v1.0/removebg',
            files={'image_file': ('image.png', input_bytes)},
            data={'size': 'auto'},
            headers={'X-Api-Key': api_key},
            timeout=30
        )
        if r.status_code == 200:
            try:
                from app.services.cost_tracker import record_image_cost
                record_image_cost(model="remove.bg")
            except Exception:
                pass
            return r.content
        print(f'[remove.bg] API failed: {r.status_code} {r.text[:200]}')
    except Exception as e:
        print(f'[remove.bg] request error: {e}')
    return None


def _remove_bg_local(input_bytes: bytes) -> bytes | None:
    """本地 rembg 抠图（需要提前放好模型文件）。"""
    if not os.path.exists(LOCAL_MODEL_PATH):
        return None
    if os.path.getsize(LOCAL_MODEL_PATH) < 1_000_000:  # 模型不完整
        return None
    try:
        from rembg import remove
        return remove(input_bytes)
    except Exception as e:
        print(f'[remove_background] local rembg failed: {e}')
        return None


def remove_background(input_bytes: bytes) -> bytes | None:
    """
    去除图片背景，返回带透明通道的 PNG 字节。
    优先级：remove.bg API（有 key 时）> 本地 rembg > 失败返回 None。
    调用方在返回 None 时应回退到原图，绝不阻断上传流程。
    """
    # 1. 优先使用 remove.bg 在线服务（无需本地大模型，推荐）
    api_key = os.environ.get('REMOVE_BG_API_KEY')
    if api_key:
        out = _remove_bg_api(input_bytes, api_key)
        if out:
            return out

    # 2. 无 API key 或 API 失败时，尝试本地 rembg
    return _remove_bg_local(input_bytes)
