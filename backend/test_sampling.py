"""temperature / top_p 盲测对比：直接调用 DeepSeek 客户端，在内存改配置，不落库。
同一句 prompt 重复采样，直观看出两个参数的影响。
"""
import sys
sys.path.insert(0, r"E:\ai-wardrobe-agent\backend")

import app.config as cfg
from app.llm import get_llm_client

client = get_llm_client()

PROMPT = "推荐一套春天通勤的简约风穿搭（上衣/下装/鞋各一件），并各用一句话说明选它的理由。"


def sample(temp: float, top_p: float) -> str:
    # 直接改全局运行配置（仅本进程内存，不影响数据库/其他请求）
    cfg.MODEL_CONFIG["temperature"] = temp
    cfg.MODEL_CONFIG["top_p"] = top_p
    msgs = [
        {"role": "system", "content": "你是专业穿搭助手，用简体中文回答。"},
        {"role": "user", "content": PROMPT},
    ]
    # 不显式传 temperature，让它读刚改的全局值；top_p 也读全局
    r = client.chat(msgs, user_id=1)
    return r["choices"][0]["message"]["content"]


def trial(label: str, temp: float, top_p: float, n: int = 3):
    print(f"\n{'='*70}\n{label}  (temperature={temp}, top_p={top_p}, 采样{n}次)\n{'='*70}")
    outs = [sample(temp, top_p) for _ in range(n)]
    for i, o in enumerate(outs, 1):
        print(f"\n--- 采样{i}（共{len(o)}字）---\n{o[:220]}")
    same = len(set(outs)) == 1
    print(f"\n>> 三次结果完全相同？ {'是（越低越确定）' if same else '否（越高越发散）'}")


# 1) 固定 top_p=1.0，拉 temperature
trial("【A】低温度·保守确定", 0.2, 1.0)
trial("【B】中温度·默认", 0.7, 1.0)
trial("【C】高温度·发散创意", 1.2, 1.0)

# 2) 固定 temperature=0.7，拉 top_p
trial("【D】低 top_p·聚焦常见说法", 0.7, 0.3)
trial("【E】高 top_p·允许更多低频词", 0.7, 0.95)
