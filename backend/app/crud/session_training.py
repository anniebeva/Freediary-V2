from typing import List, Optional
import app.models.memory_storage as storage
from app.models.memory_storage import Training, Session
from app.schemas.training import TrainingCreate, TrainingUpdate


def create_session_training(session_id: str, training_data: TrainingCreate) -> Optional[Training]:
    """Create training in a session (for anonymous users)"""
    session = storage.get_session(session_id)
    if not session:
        return None
    
    session.training_counter += 1
    
    training = Training(
        user_id=-1,  # Special ID for session trainings
        type=training_data.type,
        date=training_data.date,
        difficulty=training_data.difficulty,
        notes=training_data.notes,
        pool_training=training_data.poolTraining,
        depth_training=training_data.depthTraining,
        gym_training=training_data.gymTraining,
    )
    training.id = session.training_counter
    
    session.trainings[training.id] = training
    return training


def get_session_trainings(session_id: str) -> List[Training]:
    """Get all trainings for a session"""
    session = storage.get_session(session_id)
    if not session:
        return []
    return list(session.trainings.values())


def get_session_training_by_id(session_id: str, training_id: int) -> Optional[Training]:
    """Get specific training from a session"""
    session = storage.get_session(session_id)
    if not session:
        return None
    return session.trainings.get(training_id)


def update_session_training(session_id: str, training_id: int, training_data: TrainingUpdate) -> Optional[Training]:
    """Update training in a session"""
    session = storage.get_session(session_id)
    if not session:
        return None
    
    training = session.trainings.get(training_id)
    if not training:
        return None
    
    training.type = training_data.type
    training.date = training_data.date
    training.difficulty = training_data.difficulty
    training.notes = training_data.notes
    training.pool_training = training_data.poolTraining
    training.depth_training = training_data.depthTraining
    training.gym_training = training_data.gymTraining
    
    return training


def delete_session_training(session_id: str, training_id: int) -> bool:
    """Delete training from a session"""
    session = storage.get_session(session_id)
    if not session:
        return False
    
    if training_id not in session.trainings:
        return False
    
    # Also delete associated exercises
    exercise_ids_to_delete = []
    for exercise_id, exercise in session.exercises.items():
        if exercise.training_id == training_id:
            exercise_ids_to_delete.append(exercise_id)
    
    for exercise_id in exercise_ids_to_delete:
        del session.exercises[exercise_id]
    
    del session.trainings[training_id]
    return True


def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create a new one"""
    if session_id:
        session = storage.get_session(session_id)
        if session:
            return session_id
    
    return storage.create_session()