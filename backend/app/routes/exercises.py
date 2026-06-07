from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.crud.exercise import (
    create_exercise,
    delete_exercise,
    get_exercise_by_id,
    get_exercises_by_training_id,
    is_exercise_training_owner,
    update_exercise,
)
from app.crud.training import is_training_owner
from app.schemas.exercise import ExerciseCreate, ExerciseResponse, ExerciseUpdate
from app.models.models import User
from app.core.logging import log_business_event

router = APIRouter(prefix="/exercises", tags=["exercises"])


def get_user_role(current_user: User) -> str:
    """Получить роль пользователя в виде строки"""
    if not current_user:
        return "guest"
    user_role = str(current_user.role) if hasattr(current_user, 'role') else "user"
    return user_role


def format_exercise_response(exercise):
    """Преобразует объект Exercise или SessionExercise в словарь для ответа"""
    return {
        "id": exercise.id,
        "name": exercise.name,
        "notes": exercise.notes,
        "training_id": exercise.training_id,
    }


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_training_exercise(
    exercise_data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = getattr(current_user, 'id', 0) if current_user else 0
    user_role = get_user_role(current_user)
    
    if not is_training_owner(db, exercise_data.training_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can add exercises only to your own trainings",
        )
    
    exercise = create_exercise(db, exercise_data, user_id, x_session_id, user_role)
    
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise was not created",
        )
    
    # Log exercise creation event
    log_business_event("exercise_created", {
        "user_id": user_id,
        "training_id": exercise_data.training_id,
        "exercise_id": exercise.id,
        "exercise_name": exercise_data.name,
        "session_id": x_session_id or "none"
    })
    
    return format_exercise_response(exercise)


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_my_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = getattr(current_user, 'id', 0) if current_user else 0
    user_role = get_user_role(current_user)
    
    exercise = get_exercise_by_id(db, exercise_id, user_id, x_session_id, user_role)
    
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )
    
    if not is_exercise_training_owner(db, exercise_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only exercises from your own trainings",
        )
    
    return format_exercise_response(exercise)


@router.get("/training/{training_id}", response_model=List[ExerciseResponse])
def get_training_exercises(
    training_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = getattr(current_user, 'id', 0) if current_user else 0
    user_role = get_user_role(current_user)
    
    if not is_training_owner(db, training_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can view exercises only for your own trainings",
        )
    
    exercises = get_exercises_by_training_id(db, training_id, user_id, x_session_id, user_role)
    return [format_exercise_response(ex) for ex in exercises]


@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_my_exercise(
    exercise_id: int,
    exercise_data: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = getattr(current_user, 'id', 0) if current_user else 0
    user_role = get_user_role(current_user)
    
    if not is_exercise_training_owner(db, exercise_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can update only exercises from your own trainings",
        )
    
    updated_exercise = update_exercise(db, exercise_id, exercise_data, user_id, x_session_id, user_role)
    
    if updated_exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )
    
    return format_exercise_response(updated_exercise)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    user_id = getattr(current_user, 'id', 0) if current_user else 0
    user_role = get_user_role(current_user)
    
    if not is_exercise_training_owner(db, exercise_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can delete only exercises from your own trainings",
        )
    
    if not delete_exercise(db, exercise_id, user_id, x_session_id, user_role):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )
    
    # Log exercise deletion event
    log_business_event("exercise_deleted", {
        "user_id": user_id,
        "exercise_id": exercise_id,
        "session_id": x_session_id or "none"
    })
    
    return None
