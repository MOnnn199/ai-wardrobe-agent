"""统一鉴权与角色权限依赖。

- get_current_user: 从 JWT 解析并加载 User（校验账号是否被禁用）；
- require_roles(*roles): 路由级依赖，限制访问角色。
"""
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.models import get_db
from app.models.user import User
from app.auth.jwt import verify_token


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录或登录已失效")
    payload = verify_token(authorization[7:])
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="未登录或登录已失效")
    try:
        uid = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="未登录或登录已失效")
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=403, detail="账号已被禁用")
    return user


def require_roles(*roles: str):
    """路由级依赖：仅允许指定角色访问（如 require_roles('stylist', 'admin')）。"""
    def _dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="无权限访问该资源")
        return user
    return _dependency
