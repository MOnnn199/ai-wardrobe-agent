from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models import get_db, User
import hashlib
from datetime import datetime
from app.auth.jwt import create_access_token, verify_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

SALT = "ai-wardrobe-fixed-salt-v1"


def hash_password(p: str) -> str:
    return hashlib.sha256((p + SALT).encode("utf-8")).hexdigest()


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str = ""


class LoginResponse(BaseModel):
    token: str
    role: str
    nickname: str
    user_id: int


def _valid_city(city: str) -> str:
    """过滤掉占位文案，只保留真实城市名。"""
    if not city:
        return ''
    city = city.strip()
    if city in ('当前位置', '未知位置', '定位中'):
        return ''
    return city


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=401, detail="账号已被禁用")
    # 记录本次登录时间与地点（用用户资料里已有的真实城市）
    user.last_login_at = datetime.now()
    user.last_login_city = _valid_city(user.city)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        token=token,
        role=user.role,
        nickname=user.nickname or user.username,
        user_id=user.id,
    )


@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """注册新用户端账号（role=user）。注册成功后直接返回 token 自动登录。
    每个用户拥有独立衣橱（clothing_items 按 user_id 隔离），新用户衣橱为空。"""
    username = req.username.strip()
    if len(username) < 2:
        raise HTTPException(status_code=400, detail="用户名至少 2 个字符")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    exists = db.query(User).filter(User.username == username).first()
    if exists:
        raise HTTPException(status_code=409, detail="该用户名已被注册")

    user = User(
        username=username,
        password_hash=hash_password(req.password),
        role="user",
        nickname=req.nickname.strip() or username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        token=token,
        role=user.role,
        nickname=user.nickname or user.username,
        user_id=user.id,
    )


@router.post("/logout")
def logout():
    # 采用无状态 JWT：登录态由 token 自身有效期保证，无需服务端存储。
    # 默认 JWT_SECRET_KEY 每次后端启动随机生成，因此重启后端即全员强制重新登录；
    # 前端清除本地 token 即完成登出。如需登录态跨重启保持，在 .env 设置固定 JWT_SECRET_KEY。
    return {"ok": True}


@router.get("/me")
def me(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    payload = verify_token(authorization[7:])
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="登录已失效")
    try:
        uid = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="登录已失效")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=403, detail="账号已被禁用")
    return {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "nickname": user.nickname or user.username,
    }


def ensure_seed_users(db: Session):
    """启动时确保存在 user/stylist/admin 三个演示账号（密码均为 123456）。"""
    seeds = [
        ("user", "user", "穿搭体验官"),
        ("stylist", "stylist", "搭配师小琳"),
        ("admin", "admin", "系统管理员"),
    ]
    for username, role, nickname in seeds:
        exists = db.query(User).filter(User.username == username).first()
        if not exists:
            db.add(
                User(
                    username=username,
                    password_hash=hash_password("123456"),
                    role=role,
                    nickname=nickname,
                )
            )
    db.commit()
