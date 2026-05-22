from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header

from app.core.dependencies import get_current_user
from app.crud.exercise import (
    create_exercise,
    delete_exercise,
    get_exercise_by_id,
    get_exercises_by_training_id,
    is_exercise_training_owner,
    update_exercise,
)
from app.crud.training import get_training_by_id, is_training_owner
from app.models.memory_storage import User
from app.schemas.exercise import ExerciseCreate, ExerciseResponse, ExerciseUpdate


router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_training_exercise(
    exercise_data: ExerciseCreate,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):

    training = get_training_by_id(exercise_data.training_id, x_session_id)

    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if not is_training_owner(training_id=exercise_data.training_id, user_id=current_user.id, session_id=x_session_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can add exercises only to your own trainings",
        )

    # СОЗДАЁМ УПРАЖНЕНИЕ
    exercise = create_exercise(exercise_data, x_session_id)
    
    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exercise was not created",
        )

    # ВОЗВРАЩАЕМ СОЗДАННОЕ УПРАЖНЕНИЕ
    return exercise


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_my_exercise(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
):
    exercise = get_exercise_by_id(exercise_id)

    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    if not is_exercise_training_owner(exercise_id=exercise_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can access only exercises from your own trainings",
        )

    return exercise

@router.get("/training/{training_id}", response_model=List[ExerciseResponse])
def get_training_exercises(
    training_id: int,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    training = get_training_by_id(training_id, x_session_id)
    
    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )
    
    if not is_training_owner(
        training_id=training_id, 
        user_id=current_user.id, 
        session_id=x_session_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can view exercises only for your own trainings",
        )
    
    return get_exercises_by_training_id(training_id)


@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_my_exercise(
    exercise_id: int,
    exercise_data: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
):
    if get_exercise_by_id(exercise_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    if not is_exercise_training_owner(exercise_id=exercise_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can update only exercises from your own trainings",
        )

    updated_exercise = update_exercise(exercise_id=exercise_id, exercise_data=exercise_data)

    return updated_exercise


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_exercise(
    exercise_id: int,
    current_user: User = Depends(get_current_user),
):
    if get_exercise_by_id(exercise_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    if not is_exercise_training_owner(exercise_id=exercise_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can delete only exercises from your own trainings",
        )

    delete_exercise(exercise_id)

    return None