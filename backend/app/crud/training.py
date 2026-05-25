from typing import List, Optional, Union
from sqlalchemy.orm import Session
from datetime import datetime as dt, timedelta, date, timezone

from app.models.models import (
    Training, SessionTraining, SessionTracking, Exercise, 
    SessionExercise, TrainingType
)
from app.schemas.training import TrainingCreate, TrainingUpdate


def parse_date(date_input: Union[str, date]) -> date:
    """Преобразует строку или date в date"""
    if isinstance(date_input, str):
        return dt.strptime(date_input, "%Y-%m-%d").date()
    return date_input


def get_trainings(db: Session, user_id: int, session_id: Optional[str] = None) -> List[Union[Training, SessionTraining]]:
    """Получить тренировки в зависимости от типа пользователя"""
    if user_id > 0:
        return db.query(Training).filter(Training.user_id == user_id).order_by(Training.date.desc()).all()
    elif user_id == 0 and session_id:
        return db.query(SessionTraining).filter(SessionTraining.session_id == session_id).order_by(SessionTraining.date.desc()).all()
    else:
        return []


def get_training_by_id(db: Session, training_id: int, user_id: int, session_id: Optional[str] = None) -> Optional[Union[Training, SessionTraining]]:
    """Получить тренировку по ID в зависимости от типа пользователя"""
    if user_id > 0:
        return db.query(Training).filter(
            Training.id == training_id,
            Training.user_id == user_id
        ).first()
    elif user_id == 0 and session_id:
        return db.query(SessionTraining).filter(
            SessionTraining.id == training_id,
            SessionTraining.session_id == session_id
        ).first()
    return None


def get_session_by_id(db: Session, session_id: str) -> Optional[SessionTracking]:
    """Получить сессию по ID"""
    return db.query(SessionTracking).filter(SessionTracking.session_id == session_id).first()


def get_or_create_session(db: Session, session_id: str) -> SessionTracking:
    """Получить или создать сессию для гостя"""
    session = get_session_by_id(db, session_id)
    if not session:
        now = dt.now(timezone.utc)
        expires_at = now + timedelta(hours=24)
        session = SessionTracking(
            session_id=session_id,
            expires_at=expires_at,
            created_at=now,
            last_accessed=now
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    else:
        # Обновляем время последнего доступа через update
        db.query(SessionTracking).filter(SessionTracking.session_id == session_id).update(
            {'last_accessed': dt.now(timezone.utc)}
        )
        db.commit()
        session = get_session_by_id(db, session_id)  # перезагружаем
    return session

def create_training(db: Session, training_data: TrainingCreate, user_id: int, session_id: Optional[str] = None) -> Optional[Union[Training, SessionTraining]]:
    """Создать новую тренировку"""
    if user_id != 0:
        from app.crud.user import get_user_by_id
        user = get_user_by_id(db, user_id)
        if not user:
            return None
    
    if isinstance(training_data.type, str):
        training_type_value = training_data.type
    else:
        training_type_value = training_data.type.value
    
    training_date = parse_date(training_data.date)
    
    if user_id > 0:
        db_training = Training(
            user_id=user_id,
            type=training_type_value,
            date=training_date,
            difficulty=training_data.difficulty,
            notes=training_data.notes,
            pool_training=training_data.poolTraining,
            depth_training=training_data.depthTraining,
            gym_training=training_data.gymTraining
        )
    elif user_id == 0 and session_id:
        get_or_create_session(db, session_id)
        db_training = SessionTraining(
            session_id=session_id,
            type=training_type_value,
            date=training_date,
            difficulty=training_data.difficulty,
            notes=training_data.notes,
            pool_training=training_data.poolTraining,
            depth_training=training_data.depthTraining,
            gym_training=training_data.gymTraining
        )
    else:
        return None
    
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    
    return db_training

def update_training(db: Session, training_id: int, training_data: TrainingUpdate, user_id: int, session_id: Optional[str] = None) -> Optional[Union[Training, SessionTraining]]:
    """Обновить тренировку"""
    training = get_training_by_id(db, training_id, user_id, session_id)
    if not training:
        return None
    
    # Преобразуем Pydantic модель в словарь (исключая None)
    update_data = training_data.model_dump(exclude_unset=True)
    
    # Конвертируем camelCase в snake_case для полей JSON (если нужно)
    if 'poolTraining' in update_data:
        update_data['pool_training'] = update_data.pop('poolTraining')
    if 'depthTraining' in update_data:
        update_data['depth_training'] = update_data.pop('depthTraining')
    if 'gymTraining' in update_data:
        update_data['gym_training'] = update_data.pop('gymTraining')
    
    # Преобразуем тип в строку, если это enum
    if 'type' in update_data and update_data['type'] is not None:
        if hasattr(update_data['type'], 'value'):
            update_data['type'] = update_data['type'].value
    
    # Преобразуем дату
    if 'date' in update_data and update_data['date'] is not None:
        update_data['date'] = parse_date(update_data['date'])
    
    # Обновляем атрибуты
    for key, value in update_data.items():
        if hasattr(training, key):
            setattr(training, key, value)
    
    db.commit()
    db.refresh(training)
    
    return training

def delete_training(db: Session, training_id: int, user_id: int, session_id: Optional[str] = None) -> bool:
    """Удалить тренировку"""
    training = get_training_by_id(db, training_id, user_id, session_id)
    if not training:
        return False
    
    db.delete(training)
    db.commit()
    return True


def is_training_owner(db: Session, training_id: int, user_id: int, session_id: Optional[str] = None) -> bool:
    """Проверить, является ли пользователь владельцем тренировки"""
    training = get_training_by_id(db, training_id, user_id, session_id)
    return training is not None


def cleanup_expired_sessions(db: Session) -> int:
    """Удалить просроченные сессии и связанные данные"""
    now = dt.now(timezone.utc)
    expired_sessions = db.query(SessionTracking).filter(SessionTracking.expires_at < now).all()
    count = len(expired_sessions)
    for session in expired_sessions:
        db.delete(session)
    db.commit()
    return count