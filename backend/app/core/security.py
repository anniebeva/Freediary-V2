from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext


SECRET_KEY = "freediary-dev-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
MAX_PASSWORD_LENGTH = 72  # bcrypt has a maximum of 72 bytes

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password.encode('utf-8')) > MAX_PASSWORD_LENGTH:
        return False
    return password_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Проверяем длину в байтах
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Безопасное обрезание до 72 байт, не разрезая многобайтовые символы
        # Находим последний полный символ в пределах 72 байт
        truncated_bytes = password_bytes[:72]
        # Удаляем неполные байты в конце
        while truncated_bytes and truncated_bytes[-1] & 0b11000000 == 0b10000000:
            truncated_bytes = truncated_bytes[:-1]
        truncated = truncated_bytes.decode('utf-8', 'ignore')
        return password_context.hash(truncated)
    return password_context.hash(password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": subject,
        "exp": expire,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)