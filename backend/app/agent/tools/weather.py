import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
from ..tool_registry import Tool

# WMO Weather interpretation codes (WW)
WEATHER_CODE_MAP = {
    0: '晴',
    1: '晴间多云', 2: '局部多云', 3: '阴',
    45: '雾', 48: '雾凇',
    51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
    56: '冻 drizzle', 57: '冻 drizzle',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    77: '雪粒',
    80: '阵雨', 81: '阵雨', 82: '暴雨',
    85: '阵雪', 86: '阵雪',
    95: '雷雨', 96: '雷雨伴冰雹', 99: '雷雨伴冰雹'
}


def _weather_text(code: int) -> str:
    return WEATHER_CODE_MAP.get(code, '晴')


class WeatherTool(Tool):
    def __init__(self):
        super().__init__(name="get_weather", description="查询指定城市的天气")

    def get_definition(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名称"},
                        "date": {"type": "string", "description": "日期，如今天、明天、后天或YYYY-MM-DD"}
                    },
                    "required": ["city"]
                }
            }
        }

    def _parse_date_offset(self, date_str: str) -> tuple[int, str]:
        """把自然语言日期转成未来7天内的偏移和iso日期"""
        today = datetime.now().date()
        s = (date_str or '').strip()
        if s in ('今天', '今日', 'now', 'today'):
            return 0, str(today)
        if s in ('明天', '明日', 'tomorrow'):
            return 1, str(today + timedelta(days=1))
        if s in ('后天', '後天', 'day_after_tomorrow'):
            return 2, str(today + timedelta(days=2))
        if s in ('大后天', '大後天'):
            return 3, str(today + timedelta(days=3))
        try:
            d = datetime.strptime(s, "%Y-%m-%d").date()
            delta = (d - today).days
            if 0 <= delta <= 6:
                return delta, str(d)
            # 超出7天 forecast 范围则回退到今天
            return 0, str(today)
        except Exception:
            return 0, str(today)

    def _geocode(self, city: str) -> tuple[float, float] | tuple[None, None]:
        """通过 Open-Meteo Geocoding API 把城市名转成经纬度"""
        try:
            url = (
                "https://geocoding-api.open-meteo.com/v1/search"
                f"?name={urllib.parse.quote(city)}&count=1&language=zh&format=json"
            )
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results') or []
            if results:
                return float(results[0]['latitude']), float(results[0]['longitude'])
        except Exception as e:
            print(f"[weather] geocode failed for {city}: {e}")
        return None, None

    def _fetch_forecast(self, lat: float, lon: float) -> dict | None:
        """调用 Open-Meteo forecast API 获取未来7天天气"""
        try:
            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                "&daily=weathercode,temperature_2m_max,temperature_2m_min"
                "&timezone=auto&forecast_days=7"
            )
            with urllib.request.urlopen(url, timeout=10) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f"[weather] forecast failed: {e}")
            return None

    def execute(self, arguments: dict) -> str:
        city = arguments.get("city", "")
        date_str = arguments.get("date", "今天")
        lat = arguments.get("lat")
        lon = arguments.get("lon")

        # 优先使用经纬度；否则根据城市名反查；最后回退北京
        if lat is None or lon is None:
            if city:
                lat, lon = self._geocode(city)
            if lat is None or lon is None:
                lat, lon = 39.9042, 116.4074
                city = city or "北京"

        data = self._fetch_forecast(lat, lon)
        if not data:
            return json.dumps({
                "city": city or "未知",
                "date": date_str,
                "temperature": "28",
                "condition": "晴",
                "error": "天气服务暂不可用，使用默认数据"
            }, ensure_ascii=False)

        daily = data.get("daily", {})
        codes = daily.get("weathercode", [])
        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        dates = daily.get("time", [])

        offset, target_date = self._parse_date_offset(date_str)
        if offset >= len(codes):
            offset = 0

        code = int(codes[offset]) if offset < len(codes) else 0
        t_max = max_temps[offset] if offset < len(max_temps) else None
        t_min = min_temps[offset] if offset < len(min_temps) else None

        try:
            avg_temp = round((float(t_max) + float(t_min)) / 2)
        except Exception:
            avg_temp = t_max or t_min or 28

        result = {
            "city": city or data.get("timezone", "当前定位"),
            "date": target_date,
            "condition": _weather_text(code),
            "temperature": avg_temp,
            "temperature_max": t_max,
            "temperature_min": t_min,
            "windspeed": "--"
        }
        return json.dumps(result, ensure_ascii=False)
