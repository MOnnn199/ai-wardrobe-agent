# Scheduled tasks -> 通知中心
# 衣橱健康月报（每月 1 条） / 穿搭热点推送（每月 1 条，内容来自社交平台，非用户衣橱）
# 今日穿搭由首页实时展示，不进通知中心；
# 闲置衣物 / 重复购买 不进通知中心（重复购买改为上传时由前端提示）。
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.models import SessionLocal
from app.models.user import User
from app.models.wardrobe import ClothingItem
from app.services.notifications import create_notification
from datetime import date

scheduler = AsyncIOScheduler()


# ===================== 衣橱分析辅助 =====================
def _analyze_wardrobe(items):
    """返回 (total, cats, unused, dupes)。unused 为超过 90 天没穿的衣物明细。"""
    today = date.today()
    total = len(items)
    cats = {}
    unused = []
    for i in items:
        cats[i.category] = cats.get(i.category, 0) + 1
        days_owned = (today - i.purchase_date).days if i.purchase_date else None
        days_idle = (today - i.last_worn).days if i.last_worn else None
        is_idle = False
        if i.last_worn and days_idle > 90:
            is_idle = True
        elif (i.last_worn is None) and i.purchase_date and days_owned > 90:
            is_idle = True
        if is_idle:
            unused.append({
                'name': i.name,
                'days_idle': days_idle,
                'days_owned': days_owned,
                'wear_count': i.wear_count or 0,
            })
    name_counts = {}
    for i in items:
        name_counts[i.name] = name_counts.get(i.name, 0) + 1
    dupes = [{'name': n, 'count': c} for n, c in name_counts.items() if c > 1]
    return total, cats, unused, dupes


# ===================== 1. 今日穿搭（不进通知中心）=====================
# 今日穿搭推荐由用户端首页实时调用 /user/outfit-by-weather 展示，
# 无需写入通知中心，故不再生成 daily_push 通知。
def run_daily_push(user_id=None):
    """保留空实现以兼容旧引用；今日穿搭在首页实时展示，不写通知。"""
    return


# ===================== 2. 衣橱健康月报（每月一条）=====================
def run_monthly_report(user_id=None):
    """每月 1 号：扫描衣橱生成健康月报（每月每条用户仅一条）。闲置/重复作为月报指标呈现，不再单独发通知。"""
    from app.models.notification import Notification
    this_month = date.today().strftime('%Y-%m')
    title = f'{this_month} 衣橱健康月报'
    db = SessionLocal()
    users = [db.query(User).get(user_id)] if user_id else db.query(User).all()
    users = [u for u in users if u]
    for user in users:
        # 幂等：本月已生成则跳过，避免重复
        if db.query(Notification).filter(Notification.user_id == user.id, Notification.type == 'monthly_report', Notification.title == title).first():
            continue
        items = db.query(ClothingItem).filter(ClothingItem.user_id == user.id).all()
        total, cats, unused, dupes = _analyze_wardrobe(items)
        cat_cn = {'top': '上装', 'bottom': '下装', 'shoes': '鞋子', 'accessory': '配饰'}
        cat_dist = '，'.join(f'{cat_cn.get(k, k)} {v}' for k, v in cats.items())
        lines = [
            f'你的衣橱健康月报（{this_month}）',
            f'· 衣物总数：{total} 件',
            f'· 分类分布：{cat_dist}',
        ]
        if dupes:
            lines.append('· 重复购买：' + '，'.join(f'{d["name"]} ×{d["count"]}' for d in dupes))
        else:
            lines.append('· 重复购买：无')
        if unused:
            lines.append(f'· 闲置（>90天未穿）：{len(unused)} 件')
            for u in unused[:5]:
                idle_txt = f'已 {u["days_idle"]} 天没穿' if u['days_idle'] is not None else f'购入 {u["days_owned"]} 天未穿'
                advice = '建议淘汰/捐赠' if (u['days_owned'] or 0) > 180 and u['wear_count'] < 10 else '建议搭配再利用'
                lines.append(f'   - 「{u["name"]}」{idle_txt}（穿 {u['wear_count']} 次），{advice}')
        else:
            lines.append('· 闲置（>90天未穿）：无，保持得不错！')
        create_notification(db, user.id, 'monthly_report', title, '\n'.join(lines))
    db.close()


# ===================== 3. 穿搭热点推送（每月一条，AI 动态整理）=====================
_TREND_CACHE = {}  # 月份 -> content，避免同一月份重复调用大模型


def _retrieve_knowledge(query: str, k: int = 4) -> str:
    """检索运营知识库（RAG），把团队维护的趋势/穿搭法则作为权威参考注入推理。失败安全降级为空。"""
    try:
        from app.rag.embedder import Embedder
        from app.rag.vector_store import VectorStore
        vec = Embedder().embed(query)
        results = VectorStore().search(vec, top_k=k)
        texts = [r.get('text', '').strip() for r in results if r.get('text')]
        texts = [t for t in texts if t]
        if not texts:
            return ''
        return '\n\n'.join(f'· {t}' for t in texts[:k])
    except Exception as e:
        print('[knowledge retrieve] failed:', e)
        return ''


def _generate_trend_content(this_month: str) -> str:
    """调用 DeepSeek（Responses API + web_search 工具）实时联网检索当月穿搭热点并整理。"""
    if this_month in _TREND_CACHE:
        return _TREND_CACHE[this_month]
    from app.llm import get_llm_client
    year, month = this_month.split('-')
    month_cn = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][int(month) - 1]
    season = {12:'冬季',1:'冬季',2:'冬季',3:'春季',4:'春季',5:'春季',6:'夏季',7:'夏季',8:'夏季',9:'秋季',10:'秋季',11:'秋季'}[int(month)]
    sys_prompt = (
        '你是一位专业的时尚趋势分析师。你会被要求整理当月正在流行的穿搭趋势，'
        '请基于实时联网检索到的社交平台（小红书 / 抖音 / 微博等）与时尚媒体信息，'
        '用中文给出具体、可落地的趋势。不要编造无法核实的精确播放量 / 搜索量数据；'
        '若检索不到明确信息，可基于季节常识合理推断并简要注明。'
    )
    user_prompt = (
        f'请联网检索并整理 {year} 年 {month_cn}（{season}）当月正在流行的穿搭热点趋势。\n'
        f'要求：\n'
        f'1. 结合 {season} 季节特征与近期（当月）时尚动向，给出 6~8 条具体趋势；\n'
        f'2. 每条格式为「- 趋势名称：一句话解读」（解读要具体、有画面感）；\n'
        f'3. 只输出这 6~8 条，不要前言后语。'
    )
    # 接入运营知识库：优先与我们维护的趋势知识对齐
    kb = _retrieve_knowledge(f'{year}年{month_cn}{season}穿搭趋势流行')
    if kb:
        user_prompt += (
            f'\n\n【运营知识库参考】（以下是我们团队维护的趋势/穿搭法则，请优先与之一致，'
            f'仅在知识库未覆盖时再基于联网检索补充）：\n{kb}'
        )
    try:
        client = get_llm_client()
        text = client.chat_with_web_search(user_prompt, system=sys_prompt)
        if text and not text.startswith('（演示模式）') and not text.startswith('模型调用'):
            content = f'{this_month} 穿搭热点：\n' + text
            _TREND_CACHE[this_month] = content
            return content
    except Exception:
        pass
    # 大模型不可用时的兜底（静态）
    fallback = (
        f'{this_month} 穿搭热点（综合时尚动向）：\n'
        '· 基础款叠穿：用白T/衬衫做层次，应对昼夜温差\n'
        '· 低饱和大地色：卡其/燕麦/深棕营造高级感\n'
        '· 阔腿裤：兼顾舒适与时髦，通勤休闲两宜\n'
        '· 轻机能风：多口袋工装+轻盈面料，机能感不笨重\n'
        '· 多巴胺点缀：全身低饱和，用配饰一抹亮色提气\n'
        '· 衬衫裙：一件搞定，利落显比例'
    )
    _TREND_CACHE[this_month] = fallback
    return fallback


def run_trend_push(user_id=None):
    """每月 1 号（或用户首次打开通知时按需）：用大模型动态整理当月穿搭热点推送。

    - 内容按月动态生成，不同月份内容不同；
    - 同一月份内容通过 _TREND_CACHE 缓存，避免对每个用户重复调用大模型；
    - 大模型不可用时回退到静态兜底文案。
    """
    from app.models.notification import Notification
    this_month = date.today().strftime('%Y-%m')
    title = f'{this_month} 穿搭热点推送'
    content = _generate_trend_content(this_month)
    db = SessionLocal()
    users = [db.query(User).get(user_id)] if user_id else db.query(User).all()
    users = [u for u in users if u]
    for user in users:
        # 幂等：本月已生成则跳过，避免重复
        if db.query(Notification).filter(Notification.user_id == user.id, Notification.type == 'trend_push', Notification.title == title).first():
            continue
        create_notification(db, user.id, 'trend_push', title, content)
    db.close()


# ===================== 4. 重复购买检测（返回列表，不写通知）=====================
def check_duplicate_purchase(db, new_item):
    """上传新衣物后调用：检测衣橱中是否已有相似衣物，返回相似名称列表（不写入通知，由前端提示）。"""
    existing = db.query(ClothingItem).filter(
        ClothingItem.user_id == new_item.user_id,
        ClothingItem.status == 'confirmed',
        ClothingItem.id != new_item.id,
    ).all()
    similar = []
    for i in existing:
        if i.name == new_item.name:
            similar.append(i.name)
        elif i.category == new_item.category and i.color and i.color == new_item.color:
            similar.append(i.name)
    return list(dict.fromkeys(similar))  # 去重保序


# ===================== 知识缺口检测（管理员向，保留）=====================
def run_knowledge_gap():
    from app.models.conversation import Conversation
    db = SessionLocal()
    low_score = db.query(Conversation).filter(Conversation.score <= 2, Conversation.status == 'pending').all()
    topics = {}
    for c in low_score:
        topic = c.user_input[:30]
        if topic not in topics:
            topics[topic] = {'count': 0, 'example_input': c.user_input, 'conv_id': c.id}
        topics[topic]['count'] += 1
    gaps = sorted(topics.values(), key=lambda x: -x['count'])[:10]
    print(f'[Knowledge Gap Detection] total={len(low_score)} gaps={len(gaps)}')
    db.close()


# ===================== 异步 cron 包装 =====================
async def _monthly(): run_monthly_report()
async def _trend(): run_trend_push()
async def _gap(): run_knowledge_gap()


# ===================== 恶劣天气提醒（FR-C6）=====================
_RAIN_CODES = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}


def _fetch_today_weather(lat: float, lon: float) -> dict | None:
    """Open-Meteo 当日天气（无第三方 Key）。"""
    import json
    import urllib.parse
    import urllib.request
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            "&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1"
        )
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        daily = data.get('daily', {})
        return {
            'code': int((daily.get('weathercode') or [0])[0]),
            't_max': (daily.get('temperature_2m_max') or [None])[0],
            't_min': (daily.get('temperature_2m_min') or [None])[0],
        }
    except Exception as e:
        print(f"[weather-alert] fetch failed: {e}")
        return None


def run_weather_alerts():
    """每 4 小时：对配置了定位的用户检查当日天气，降雨/降雪/极端温度时推送提醒（按天幂等）。"""
    from app.models.notification import Notification
    db = SessionLocal()
    today = date.today().strftime('%Y-%m-%d')
    # 仅向 user 角色推送天气穿搭提醒（搭配师/运营端不收）
    users = db.query(User).filter(User.is_active == 1, User.role == 'user').all()
    for user in users:
        if not user.lat or not user.lon:
            continue
        wx = _fetch_today_weather(user.lat, user.lon)
        if not wx:
            continue
        code, t_max, t_min = wx['code'], wx['t_max'], wx['t_min']
        title = content = None
        if code in _RAIN_CODES:
            title = '今日降雨提醒'
            content = '今天有降雨，出门记得带伞，建议穿防水外套/防滑鞋，避免易皱易脏的浅色衣物。'
        elif code in _SNOW_CODES:
            title = '今日降雪提醒'
            content = '今天有降雪，注意保暖防滑，建议厚外套+保暖内搭+防滑鞋靴。'
        elif t_min is not None and float(t_min) <= 5:
            title = '降温提醒'
            content = f'今日最低温 {t_min}°C，明显降温，建议叠穿保暖（外套+内搭），避免单薄单品。'
        elif t_max is not None and float(t_max) >= 33:
            title = '高温提醒'
            content = f'今日最高温 {t_max}°C，建议轻薄透气面料与浅色系，注意防晒。'
        if title:
            exists = db.query(Notification).filter(
                Notification.user_id == user.id, Notification.type == 'weather_alert',
                Notification.title == f'{today} {title}').first()
            if not exists:
                create_notification(db, user.id, 'weather_alert', f'{today} {title}', content)
                try:
                    from app.main import notify_user
                    import asyncio
                    asyncio.run(notify_user(user.id, {'type': 'weather_alert', 'title': title,
                                                       'content': content}))
                except Exception:
                    pass
    db.close()


# ===================== 日程联动提醒（FR-C6）=====================
def run_event_reminders():
    """每天早晨：当天有日程（remind=1）的用户推送穿搭提醒，按天幂等。"""
    from app.models.calendar import CalendarEvent
    from app.models.notification import Notification
    db = SessionLocal()
    today = date.today()
    events = db.query(CalendarEvent).filter(
        CalendarEvent.event_date == today, CalendarEvent.remind == 1).all()
    for ev in events:
        title = f'今日日程：{ev.title}'
        exists = db.query(Notification).filter(
            Notification.user_id == ev.user_id, Notification.type == 'event_reminder',
            Notification.title == title).first()
        if exists:
            continue
        occasion_cn = ev.occasion or '该场合'
        content = (
            f'{ev.start_time or "今天"} 有日程「{ev.title}」'
            f'{(" @" + ev.location) if ev.location else ""}。'
            f'场合：{occasion_cn}，建议提前准备对应风格的穿搭。'
        )
        create_notification(db, ev.user_id, 'event_reminder', title, content)
        try:
            from app.main import notify_user
            import asyncio
            asyncio.run(notify_user(ev.user_id, {'type': 'event_reminder', 'title': title,
                                                 'content': content}))
        except Exception:
            pass
    db.close()


async def _weather(): run_weather_alerts()
async def _events(): run_event_reminders()


def init_scheduler():
    scheduler.add_job(_monthly, 'cron', day=1, hour=8, minute=0, id='wardrobe_monthly_report')
    scheduler.add_job(_trend, 'cron', day=1, hour=9, minute=0, id='trend_push')
    scheduler.add_job(_gap, 'cron', day_of_week='mon', hour=9, minute=0, id='knowledge_gap')
    scheduler.add_job(_weather, 'interval', hours=4, id='weather_alerts')
    scheduler.add_job(_events, 'cron', hour=7, minute=0, id='event_reminders')
    scheduler.start()
