"""YOLOv8 衣物区域检测与裁剪。

设计说明：本地可用的 YOLOv8n 为 COCO 权重（80 类），没有专门的服装品类（衬衫/裤装等）。
因此采用混合策略：
- 检测到 person（第 0 类）→ 裁剪到人体框（去除背景/杂物，适配"穿着照/全身照"）；
- 检测到 tie（领带，第 32 类）→ 裁剪该框；
- 均未检出 → 判定为"单品平铺照"，返回整图（多模态模型对单品照已足够）。
权重文件缺失/模型加载失败时优雅降级为整图，绝不阻断上传。
"""

import io
import os

import numpy as np

# 权重查找顺序：环境变量 YOLO_WEIGHTS > modelscope 缓存 > 常规目录
_CANDIDATE_PATHS = [
    os.getenv("YOLO_WEIGHTS", ""),
    r"E:\models\models\ultralytics--yolov8\snapshots\master\yolov8n.pt",
    os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "Ultralytics", "yolov8n.pt"),
]

PERSON_CLASS = 0  # COCO person
TIE_CLASS = 32    # COCO tie


def _resolve_weights() -> str | None:
    for p in _CANDIDATE_PATHS:
        if p and os.path.exists(p):
            return p
    # 递归搜索 modelscope 缓存
    base = os.getenv("MODELSCOPE_CACHE", r"E:\models")
    for root, _dirs, files in os.walk(os.path.join(base, "models")):
        for f in files:
            if f == "yolov8n.pt":
                return os.path.join(root, f)
    return None


class ClothingDetector:
    """懒加载 YOLOv8 检测器；不可用时 detect_and_crop 返回空列表（调用方回退整图）。"""

    _model = None
    _weights = None

    @classmethod
    def available(cls) -> bool:
        return _resolve_weights() is not None

    @classmethod
    def _load(cls):
        if cls._model is not None:
            return cls._model
        path = _resolve_weights()
        if not path:
            return None
        try:
            from ultralytics import YOLO
            cls._model = YOLO(path)
            cls._weights = path
        except Exception as e:
            print(f"[detector] YOLO load failed: {e}")
            cls._model = None
        return cls._model

    @classmethod
    def detect_and_crop(cls, image_bytes: bytes) -> list[dict]:
        """返回 [{box:[x1,y1,x2,y2], cropped: bytes|None, label: str, conf: float}]。
        cropped 为 None 表示无可靠衣物区域（调用方应使用整图）。
        """
        model = cls._load()
        if model is None:
            return []
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")
            results = model.predict(np.array(img), conf=0.25, verbose=False)
            if not results:
                return []
            boxes = results[0].boxes
            if boxes is None or len(boxes) == 0:
                return []
            w, h = img.size
            detections = []
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                conf = float(boxes.conf[i].item())
                x1, y1, x2, y2 = [float(v) for v in boxes.xyxy[i].tolist()]
                label = "person" if cls_id == PERSON_CLASS else ("tie" if cls_id == TIE_CLASS else f"obj{cls_id}")
                if cls_id in (PERSON_CLASS, TIE_CLASS):
                    x1 = max(0, x1); y1 = max(0, y1)
                    x2 = min(w, x2); y2 = min(h, y2)
                    crop = img.crop((int(x1), int(y1), int(x2), int(y2)))
                    buf = io.BytesIO()
                    crop.save(buf, format="PNG")
                    detections.append({
                        "box": [int(x1), int(y1), int(x2), int(y2)],
                        "cropped": buf.getvalue(),
                        "label": label,
                        "conf": round(conf, 3),
                    })
            return detections
        except Exception as e:
            print(f"[detector] detect failed: {e}")
            return []


def crop_for_vl(image_bytes: bytes) -> bytes | None:
    """上传管线用：返回裁剪后的图片字节；无可靠区域返回 None（调用方用整图）。

    策略调整：YOLO 检测到"person"时不再裁剪人体框——全身/穿着照保留完整画面更利于
    VL 识别衣物，且能避免把人物裁成窄条。只有领带等小配饰才局部裁剪。
    """
    detections = ClothingDetector.detect_and_crop(image_bytes)
    if not detections:
        return None
    # 只取 tie 等小配饰做局部裁剪；person 返回 None 让调用方使用整图
    tie_detections = [d for d in detections if d["label"] == "tie"]
    if tie_detections:
        tie_detections.sort(key=lambda d: d["box"][2] * d["box"][3], reverse=True)
        return tie_detections[0]["cropped"]
    return None
