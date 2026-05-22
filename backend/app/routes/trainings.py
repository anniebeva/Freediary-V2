from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header

from app.core.dependencies import get_current_user
from app.crud.exercise import get_exercises_by_training_id
from app.crud.training import (
    create_training,
    delete_training,
    get_training_by_id,
    get_trainings_by_user_id,
    is_training_owner,
    update_training,
)
from app.crud.session_training import (
    create_session_training,
    get_session_trainings,
    get_session_training_by_id,
    update_session_training,
    delete_session_training,
    get_or_create_session,
)
from app.models.memory_storage import User, Session,  get_session, create_session_with_id
from app.schemas.training import TrainingCreate, TrainingResponse, TrainingUpdate, TrainingWithExercises

router = APIRouter(prefix="/trainings", tags=["trainings"])

from fastapi import Request

@router.post("/", response_model=TrainingResponse, status_code=status.HTTP_201_CREATED)
def create_my_training(
    training_data: TrainingCreate,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    
    # If user is guest (id = 0) and session ID is provided, use session storage
    if current_user.id == 0 and x_session_id:
        print(f"🔍 Гостевой пользователь, проверяем сессию: {x_session_id}")
        
        session = get_session(x_session_id)
        
        if session is None:
            print(f"   ⚠️ Сессия НЕ найдена! Создаём с ID: {x_session_id}")
            session = create_session_with_id(x_session_id)
            print(f"   ✨ Создана новая сессия: {session.id}")
        
        training = create_session_training(session.id, training_data)
    else:
        # Regular user or guest without session ID
        print(f"🔍 Обычный пользователь или нет session_id")
        training = create_training(training_data=training_data, user_id=current_user.id)

    if training is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Training was not created",
        )

    return training



@router.get("/", response_model=List[TrainingResponse])
def get_my_trainings(
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    # If user is guest (id = 0) and session ID is provided, use session storage
    if current_user.id == 0 and x_session_id:
        session_id = get_or_create_session(x_session_id)
        return get_session_trainings(session_id)
    else:
        # Regular user or guest without session ID
        return get_trainings_by_user_id(current_user.id)


@router.get("/{training_id}", response_model=TrainingWithExercises)
def get_my_training(
    training_id: int,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    # Check session storage first for guest users
    if current_user.id == 0 and x_session_id:
        session_id = get_or_create_session(x_session_id)
        training = get_session_training_by_id(session_id, training_id)
        if training:
            return {
                "id": training.id,
                "user_id": training.user_id,
                "type": training.type,
                "date": training.date,
                "difficulty": training.difficulty,
                "notes": training.notes,
                "poolTraining": training.poolTraining,
                "depthTraining": training.depthTraining,
                "gymTraining": training.gymTraining,
                "exercises": [],  # Session trainings don't have exercises yet
            }
    
    # Check regular database
    training = get_training_by_id(training_id)

    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    return {
        "id": training.id,
        "user_id": training.user_id,
        "type": training.type,
        "date": training.date,
        "difficulty": training.difficulty,
        "notes": training.notes,
        "poolTraining": training.poolTraining,
        "depthTraining": training.depthTraining,
        "gymTraining": training.gymTraining,
        "exercises": get_exercises_by_training_id(training_id),
    }


@router.put("/{training_id}", response_model=TrainingResponse)
def update_my_training(
    training_id: int,
    training_data: TrainingUpdate,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    # Check session storage first for guest users
    if current_user.id == 0 and x_session_id:
        session_id = get_or_create_session(x_session_id)
        training = get_session_training_by_id(session_id, training_id)
        if training:
            updated_training = update_session_training(session_id, training_id, training_data)
            if updated_training:
                return updated_training
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Training was not updated",
            )
    
    # Check regular database
    training = get_training_by_id(training_id)
    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )
    
    # Check if user is owner (guest users can only update their own trainings)
    if training.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this training",
        )

    updated_training = update_training(training_id=training_id, training_data=training_data)

    return updated_training


@router.delete("/{training_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_training(
    training_id: int,
    current_user: User = Depends(get_current_user),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    # Check session storage first for guest users
    if current_user.id == 0 and x_session_id:
        session_id = get_or_create_session(x_session_id)
        training = get_session_training_by_id(session_id, training_id)
        if training:
            success = delete_session_training(session_id, training_id)
            if success:
                return None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Training was not deleted",
            )
    
    # Check regular database
    training = get_training_by_id(training_id)
    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )
    
    # Check if user is owner (guest users can only delete their own trainings)
    if training.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this training",
        )

    delete_training(training_id)

    return None
