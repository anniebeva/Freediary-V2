from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.security import ALGORITHM, SECRET_KEY
from app.crud.user import get_user_by_id
from app.models.memory_storage import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    if not token:
        # Return a default guest user object for anonymous access
        return User(username="guest", email="guest@example.com", password="")
    
    try:
        # Try to decode token if provided
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        user = get_user_by_id(int(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user
    except JWTError:
        # Return a default guest user object for anonymous access
        return User(username="guest", email="guest@example.com", password="")