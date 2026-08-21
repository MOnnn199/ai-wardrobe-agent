from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from . import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="user")  # user / stylist / admin
    nickname = Column(String, default="")
    is_active = Column(Integer, default=1)  # 1=正常 0=禁用（运营端用户管理）
    # 定位/城市（用于天气提醒等主动推送）
    city = Column(String, default="")
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    # 个人画像（供 AI 个性化推荐）
    height = Column(Integer, nullable=True)        # 身高 cm
    weight = Column(Integer, nullable=True)        # 体重 kg
    skin_tone = Column(String, default="")         # 肤色：冷白/暖黄/小麦等
    body_type = Column(String, default="")         # 体型：苹果/梨形/沙漏/矩形/倒三角
    style_preference = Column(String, default="")  # 风格偏好：简约/通勤/休闲/复古...
    created_at = Column(DateTime, server_default=func.now())
    last_login_at = Column(DateTime, nullable=True)
    last_login_city = Column(String, default="")
