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
import asyncio

scheduler = AsyncIOScheduler()


def _push_realtime(user_id: int, msg: dict):
    """尽力做实时推送（需 H5 已连接 /ws/{user_id}）。

    无运行中的事件循环（如后端启动期、纯同步触发）时静默跳过——
    通知已写入 notifications 表，用户打开通知中心仍能看到，不影响送达。
    """
    try:
        from app.main import notify_user
        loop = asyncio.get_running_loop()
        loop.create_task(notify_user(user_id, msg))
    except RuntimeError:
        pass
    except Exception:
        pass



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


# ===================== 每日天气穿搭提醒（FR-C6）========================
# Open-Meteo weathercode（精简版，基于 https://open-meteo.com/en/docs）
_WMO = {
    0:  '晴',         1:  '晴间多云',     2:  '多云',      3:  '阴',
    45: '雾',         48: '冻雾',
    51: '小毛毛雨',   53: '毛毛雨',       55: '浓毛毛雨',
    56: '冻毛毛雨',   57: '强冻毛毛雨',
    61: '小雨',       63: '中雨',         65: '大雨',
    66: '冻雨',       67: '强冻雨',
    71: '小雪',       73: '中雪',         75: '大雪',
    77: '米雪',       80: '阵雨',         81: '强阵雨',    82: '暴阵雨',
    85: '阵雪',       86: '强阵雪',
    95: '雷暴',       96: '雷暴伴小冰雹', 99: '雷暴伴大冰雹',
}
_RAIN_CODES = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}


def _fetch_today_weather(lat: float, lon: float) -> dict | None:
    """Open-Meteo 当日天气（无第三方 Key）。返回 code/t_max/t_min/precip/wind。"""
    import json
    import urllib.request
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            "&daily=weathercode,temperature_2m_max,temperature_2m_min,"
            "precipitation_probability_max,windspeed_10m_max"
            "&timezone=auto&forecast_days=1"
        )
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        d = data.get('daily', {})
        return {
            'code': int((d.get('weathercode') or [0])[0]),
            't_max': d.get('temperature_2m_max', [None])[0],
            't_min': d.get('temperature_2m_min', [None])[0],
            'pop':  (d.get('precipitation_probability_max') or [None])[0],
            'wind': (d.get('windspeed_10m_max') or [None])[0],
        }
    except Exception as e:
        print(f"[weather-alert] fetch failed: {e}")
        return None


def _compose_daily_advice(code: int, t_max, t_min, pop, wind) -> tuple[str, str]:
    """根据今天天气返回 (title, content)：每天都出 advice，不再仅异常时推。"""
    cond = _WMO.get(code, '多云')
    tmax_v = float(t_max) if t_max is not None else None
    tmin_v = float(t_min) if t_min is not None else None
    pop_v  = float(pop)  if pop  is not None else None
    wind_v = float(wind) if wind is not None else None

    # 1) 关键词强度
    severe_flags = []
    if code in _RAIN_CODES: severe_flags.append('rain')
    if code in _SNOW_CODES: severe_flags.append('snow')
    if tmax_v is not None and tmax_v >= 33: severe_flags.append('hot')
    if tmin_v is not None and tmin_v <= 5:  severe_flags.append('cold')

    # 2) 体感温度区间
    if tmax_v is not None and tmin_v is not None:
        temp_text = f'今日 {cond}，{tmin_v:.0f}~{tmax_v:.0f}°C'
    elif tmax_v is not None:
        temp_text = f'今日 {cond}，最高 {tmax_v:.0f}°C'
    else:
        temp_text = f'今日 {cond}'

    # 3) 核心建议（按强度叠加）
    if 'snow' in severe_flags:
        advice = (
            '降雪预警：厚外套 + 保暖内搭 + 防滑靴是底线；'
            '裤装优先深色防脏；少戴白色配件，避免被雪水打湿显狼狈。'
        )
    elif 'rain' in severe_flags:
        base = (
            f'降雨预警：出门带伞{("（降水概率约 " + str(int(pop_v)) + "%）") if pop_v is not None else ""}，'
            '优先防水外套 / 防滑鞋，避免浅色与易皱单品；'
        )
        base += '降温则叠穿，热则换轻薄速干内搭。' if (tmax_v or 30) >= 30 else '可加薄针织外套防凉。'
        advice = base
    elif 'hot' in severe_flags:
        advice = (
            '高温预警：浅色 + 透气面料（棉麻/速干），多巴胺点缀在配饰而非主衣；'
            '防晒帽/遮阳伞必备，避免深色吸热。'
        )
    elif 'cold' in severe_flags:
        advice = (
            '低温预警：叠穿三层（吸湿排汗内搭 + 保暖中层 + 防风外层），'
            '围巾/手套/帽子别忘；鞋子防滑优先，避开单层薄外套。'
        )
    # —— 下面是「正常天气」给具体穿搭建议 ——
    elif tmax_v is not None and tmax_v >= 28:
        advice = '体感偏热：短袖 / 薄衬衫 + 高腰裤 / 阔腿裤是基操；可以亮色单品点缀。'
    elif tmax_v is not None and tmax_v >= 22:
        advice = '体感舒适：T恤 + 轻薄长裤 / 中长裙都 OK，早晚加一件薄针织或衬衫防温差。'
    elif tmax_v is not None and tmax_v >= 15:
        advice = '微凉：长袖打底 + 薄外套（针织/衬衫/西装）正好；配饰戴起来更有层次。'
    else:
        advice = '偏冷：毛呢 / 夹克 + 围巾是稳妥搭配，深色显瘦、亮色显气色。'

    # 4) 风 / 降水小尾巴
    extra = []
    if wind_v is not None and wind_v >= 30:
        extra.append(f'风偏大（{wind_v:.0f}km/h），避免长裙与宽松大摆单品')
    if (pop_v is not None and pop_v >= 40) and 'rain' not in severe_flags:
        extra.append(f'降水概率约 {int(pop_v)}%，包里放把折叠伞更稳')
    if extra:
        advice += '｜另：' + '；'.join(extra) + '。'

    title = '今日天气穿搭'
    content = f'{temp_text}。{advice}'
    return title, content


def run_weather_alerts(user_id=None):
    """每天：对有定位的用户推送一条今日天气穿搭（按天幂等）。

    - 7:30 由 cron 触发（仅当后端当时在运行）；
    - 后端启动时、用户打开通知中心时也会按需补跑（弥补手动启动导致的错过）；
    - 传入 user_id 时只补推单个用户（通知中心按需场景）。
    """
    from app.models.notification import Notification
    db = SessionLocal()
    today = date.today().strftime('%Y-%m-%d')
    if user_id:
        users = [db.query(User).get(user_id)]
    else:
        users = db.query(User).filter(User.is_active == 1, User.role == 'user').all()
    users = [u for u in users if u]
    for user in users:
        if not user.lat or not user.lon:
            continue
        wx = _fetch_today_weather(user.lat, user.lon)
        if not wx or wx.get('code') is None:
            continue
        title_base, content = _compose_daily_advice(
            wx['code'], wx.get('t_max'), wx.get('t_min'), wx.get('pop'), wx.get('wind'),
        )
        full_title = f'{today} {title_base}'
        exists = db.query(Notification).filter(
            Notification.user_id == user.id, Notification.type == 'weather_alert',
            Notification.title == full_title,
        ).first()
        if exists:
            continue
        create_notification(db, user.id, 'weather_alert', full_title, content)
        # 实时推送给在线用户（WebSocket，循环感知，失败不影响库内通知）
        _push_realtime(user.id, {'type': 'weather_alert', 'title': title_base, 'content': content})
    db.close()


# ===================== 日程联动提醒（FR-C6）=====================
# 【已弃用】日程推送功能未启用：当前用户端无「日程」入口，用户无法创建日程，
# 故该定时任务永远不会产生有效数据，且 EventReminder 通知也无前端触达渠道。
# 保留函数与调度注册仅作占位，避免误删 CalendarEvent 模型；如需启用再开放前端入口。
def run_event_reminders():
    return
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
        _push_realtime(ev.user_id, {'type': 'event_reminder', 'title': title, 'content': content})
    db.close()


async def _weather(): run_weather_alerts()
# async def _events(): run_event_reminders()  # 见 run_event_reminders 说明（功能未启用）


def init_scheduler():
    scheduler.add_job(_monthly, 'cron', day=1, hour=8, minute=0, id='wardrobe_monthly_report')
    scheduler.add_job(_trend, 'cron', day=1, hour=9, minute=0, id='trend_push')
    scheduler.add_job(_gap, 'cron', day_of_week='mon', hour=9, minute=0, id='knowledge_gap')
    # 每天早上 7:30 给有定位的用户推一条「今日天气穿搭」（每天一条，按天幂等）
    scheduler.add_job(_weather, 'cron', hour=7, minute=30, id='weather_alerts')
    # scheduler.add_job(_events, 'cron', hour=7, minute=0, id='event_reminders')  # 日程功能未启用
    scheduler.start()
    # 后端启动即补推当天天气穿搭：对手动启动的后端，弥补 7:30 未运行而错过的推送。
    # 按天幂等，重复启动不会重复生成；Open-Meteo 不可达时静默跳过，待打开通知中心时再补。
    try:
        run_weather_alerts()
    except Exception as e:
        print('[scheduler] startup weather backfill failed:', e)
