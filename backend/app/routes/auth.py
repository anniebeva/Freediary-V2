from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response, Request  # 👈 добавить Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.models import User
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.crud.user import create_user, get_user_by_email, get_user_by_username
from app.database import get_db
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.bot.notifications import notify_login
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
def register(
    request: Request,  # 👈 ДОБАВИТЬ
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    if get_user_by_email(db, user_data.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    if get_user_by_username(db, user_data.username) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists",
        )
    
    try:
        return create_user(db, user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,  # 👈 ДОБАВИТЬ
    credentials: UserLogin,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, credentials.email)
    
    if user is None or not verify_password(credentials.password, str(user.password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=str(user.id))
    
    response.set_cookie(
        key=settings.JWT_COOKIE_NAME,
        value=access_token,
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite="strict",
        domain=settings.JWT_COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    telegram_id = getattr(user, 'telegram_id', None)
    notifications_enabled = getattr(user, 'telegram_notifications_enabled', False)
    
    if telegram_id and notifications_enabled:
        user_id = getattr(user, 'id', 0)
        background_tasks.add_task(notify_login, user_id)
    
    return Token(access_token=access_token)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=settings.JWT_COOKIE_NAME,
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite="strict",
        domain=settings.JWT_COOKIE_DOMAIN,
        path="/"
    )
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user