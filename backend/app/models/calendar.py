from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, ForeignKey
from sqlalchemy.sql import func
from . import Base


class CalendarEvent(Base):
    """应用内日程（FR-C6 日程联动）：当天有日程时早晨推送穿搭提醒。"""
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String, default="")
    event_date = Column(Date, nullable=False)      # 日程日期
    start_time = Column(String, default="")        # 开始时间 HH:MM
    end_time = Column(String, default="")          # 结束时间 HH:MM
    occasion = Column(String, default="")          # 场合：通勤/约会/运动/正式...
    location = Column(String, default="")
    note = Column(Text, default="")
    remind = Column(Integer, default=1)            # 是否推送提醒
    created_at = Column(DateTime, server_default=func.now())
