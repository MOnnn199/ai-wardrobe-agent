# A/B test engine（LLM 评审版）：同一批用例跑两套配置，用 DeepSeek 做裁判打分，
# 避免旧的"按文本长度"启发式。仍为离线对比，灰度发布（流量切分）留待后续。
import json
from app.models import SessionLocal
from app.models.conversation import Conversation
from app.schemas import ABTestResponse


class ABTestEngine:
    def run(self, test_cases: list, config_a: dict, config_b: dict) -> dict:
        """
        test_cases: list of user_input strings
        config_a/b: dicts with keys like model_name, temperature, system_prompt
        """
        from app.agent.react_agent import ReActAgent
        from app.agent.init_tools import tool_registry
        from app.utils.llm_json import extract_json_object

        agent_a = ReActAgent(tool_registry)
        agent_b = ReActAgent(tool_registry)

        judge_scores_a, judge_scores_b = [], []
        per_case = []

        for case in test_cases:
            prompt_a = config_a.get('system_prompt', '') or '你是一个专业的穿搭推荐助手。'
            prompt_b = config_b.get('system_prompt', '') or '你是一个专业的穿搭推荐助手。'
            try:
                result_a = agent_a.run(case, system_prompt=prompt_a)
                result_b = agent_b.run(case, system_prompt=prompt_b)
            except Exception as e:
                per_case.append({'case': case, 'error': str(e)})
                continue

            # LLM 裁判：同一裁判调用内对两套回复分别打分
            score_a = score_b = None
            reason = ''
            try:
                from app.llm import get_llm_client
                judge_prompt = (
                    '你是穿搭推荐质量评审。请分别对两套 AI 搭配方案打分（1-10）。\n\n'
                    f'用户需求：{case}\n\n'
                    f'【方案A】\n{result_a[:2000]}\n\n'
                    f'【方案B】\n{result_b[:2000]}\n\n'
                    '评分维度：贴合需求程度、方案可落地性、理由充分性、多样性（是否给出多套不同方案）。\n'
                    '严格返回JSON（不要markdown包裹）：{"score_a": 8, "score_b": 7, "reason": "一句话点评"}'
                )
                resp = get_llm_client().chat([
                    {"role": "system", "content": "你是严谨的 AI 评测员。"},
                    {"role": "user", "content": judge_prompt},
                ])
                content = resp["choices"][0]["message"]["content"]
                parsed = extract_json_object(content)
                if parsed:
                    score_a = float(parsed.get('score_a') or 0)
                    score_b = float(parsed.get('score_b') or 0)
                    reason = parsed.get('reason', '')
            except Exception as e:
                print('AB judge failed:', e)

            if score_a is not None:
                judge_scores_a.append(score_a)
                judge_scores_b.append(score_b)
            per_case.append({'case': case, 'score_a': score_a, 'score_b': score_b, 'reason': reason})

        total = len(judge_scores_a) or 1
        avg_a = sum(judge_scores_a) / total
        avg_b = sum(judge_scores_b) / total
        diff = round(avg_a - avg_b, 2)

        return ABTestResponse(
            config_a_score=round(avg_a, 2),
            config_b_score=round(avg_b, 2),
            difference=diff,
            recommendation='配置 A 更优' if diff > 0 else '配置 B 更优' if diff < 0 else '无明显差异',
        )
