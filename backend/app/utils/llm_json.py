"""从 LLM 回复中稳健地提取 JSON 对象。

兼容：```json 代码块包裹、前后多余文本、被 markdown 污染等情况。
"""

import json


def extract_json_object(text: str) -> dict | None:
    """从文本中提取第一个完整的 JSON 对象；失败返回 None。"""
    if not text:
        return None
    clean = text.strip()
    # 去掉 ```json ... ``` 或 ``` ... ``` 包裹
    if clean.startswith("```"):
        parts = clean.split("```")
        if len(parts) >= 2:
            clean = parts[1]
            if clean.startswith("json"):
                clean = clean[4:]
    start = clean.find("{")
    end = clean.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = clean[start:end + 1]
    try:
        return json.loads(candidate)
    except Exception:
        pass
    # 尝试去掉控制字符后再次解析
    try:
        import re
        candidate = re.sub(r"[\x00-\x1f\x7f]", "", candidate)
        return json.loads(candidate)
    except Exception:
        return None
