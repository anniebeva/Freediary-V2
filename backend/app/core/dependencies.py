from fastapi import Depends, HTTPException, status, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.crud.user import get_user_by_id
from app.models.models import User, UserRole
from app.database import get_db 


def get_token_from_cookie(request: Request) -> Optional[str]:
    """Получить токен из cookie (вместо Authorization header)"""
    return request.cookies.get(settings.JWT_COOKIE_NAME)


def get_current_user(request: Request, db: Session = Depends(get_db)):
    # 1. Пробуем взять токен из cookie
    token = request.cookies.get(settings.JWT_COOKIE_NAME)
    
    # 2. Если нет — пробуем из заголовка Authorization
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    return get_user_by_id(db, int(user_id))

def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def is_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    user_role = getattr(current_user, 'role', 'user')
    if user_role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения операции",
        )
    return current_user