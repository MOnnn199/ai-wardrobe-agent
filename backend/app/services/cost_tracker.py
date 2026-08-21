"""AI 调用成本记录器。

在 DeepSeek / remove.bg 等调用处就地记录，运营端据此做成本核算与异常监控。
单价（每 1M token，人民币）参考 DeepSeek 公开定价，可按需在 backend/.env 覆盖。
"""
from app.models import SessionLocal
from app.models.cost import CostLog

# 单价（元 / 1M tokens）。可在调用方覆盖，或未来改为读配置。
LLM_INPUT_PRICE = 1.0
LLM_OUTPUT_PRICE = 2.0
# remove.bg 免费额度内记为 0；若账户超出免费额度，可设为 0.2（元/张）。
IMAGE_COST_PER_CALL = 0.0


def record_llm_cost(user_id: int = 0, model: str = "", tokens_in: int = 0, tokens_out: int = 0):
    """记录一次 LLM 调用的 token 消耗与成本。失败静默，绝不阻断主流程。"""
    try:
        cost = (tokens_in / 1_000_000) * LLM_INPUT_PRICE + (tokens_out / 1_000_000) * LLM_OUTPUT_PRICE
        db = SessionLocal()
        db.add(CostLog(
            user_id=user_id, call_type="llm", model=model or "unknown",
            tokens_in=int(tokens_in or 0), tokens_out=int(tokens_out or 0),
            cost=round(float(cost), 6),
        ))
        db.commit()
        db.close()
    except Exception as e:
        print("[cost_tracker] record_llm_cost failed:", e)


def record_image_cost(user_id: int = 0, model: str = "remove.bg", count: int = 1, unit_cost: float = None):
    """记录图片处理（抠图等）成本。unit_cost 为 None 时按默认单价（免费额度内 0 元）。"""
    try:
        unit = unit_cost if unit_cost is not None else IMAGE_COST_PER_CALL
        db = SessionLocal()
        for _ in range(max(1, int(count or 1))):
            db.add(CostLog(
                user_id=user_id, call_type="image", model=model,
                tokens_in=0, tokens_out=0, cost=round(float(unit), 6),
            ))
        db.commit()
        db.close()
    except Exception as e:
        print("[cost_tracker] record_image_cost failed:", e)
