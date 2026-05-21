from typing import Dict, List, Optional, Any
from datetime import date
import secrets
from datetime import datetime, timedelta

class User:
    def __init__(self, username: str, email: str, password: str):
        self.id: int = 0  # Будем устанавливать при добавлении
        self.username = username
        self.email = email
        self.password = password  # В реальном проекте нужно хэшировать

class Training:
    def __init__(self, user_id: int, type: str, date: date, difficulty: int, notes: Optional[str] = None,
                 pool_training: Optional[dict] = None, depth_training: Optional[dict] = None, gym_training: Optional[dict] = None):
        self.id: int = 0  # Будем устанавливать при добавлении
        self.user_id = user_id
        self.type = type
        self.date = date
        self.difficulty = difficulty
        self.notes = notes
        self.pool_training = pool_training
        self.depth_training = depth_training
        self.gym_training = gym_training

class Exercise:
    def __init__(self, training_id: int, name: str, 
                 reps: int, sets: int, weight: float):
        self.id: int = 0  # Будем устанавливать при добавлении
        self.training_id = training_id
        self.name = name
        self.reps = reps
        self.sets = sets
        self.weight = weight

class Session:
    def __init__(self, session_id: str):
        self.id = session_id
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.data: Dict[str, Any] = {}
        self.trainings: Dict[int, Training] = {}
        self.exercises: Dict[int, Exercise] = {}
        self.training_counter = 0
        self.exercise_counter = 0
    
    def refresh(self):
        self.last_accessed = datetime.now()

# Временное хранилище данных
users_db: Dict[int, User] = {}
trainings_db: Dict[int, Training] = {}
exercises_db: Dict[int, Exercise] = {}

# Session storage
sessions_db: Dict[str, Session] = {}

# Счетчики для генерации ID
user_counter = 0
training_counter = 0
exercise_counter = 0

# Guest user ID for anonymous access
GUEST_USER_ID = 0

# Session management
def create_session() -> str:
    """Create a new session and return its ID"""
    session_id = secrets.token_urlsafe(32)
    sessions_db[session_id] = Session(session_id)
    return session_id

def get_session(session_id: str) -> Optional[Session]:
    """Get session by ID, refresh last accessed time"""
    session = sessions_db.get(session_id)
    if session:
        session.refresh()
    return session

def cleanup_old_sessions(max_age_hours: int = 24):
    """Clean up sessions older than max_age_hours"""
    cutoff = datetime.now() - timedelta(hours=max_age_hours)
    expired_sessions = [
        session_id for session_id, session in sessions_db.items()
        if session.last_accessed < cutoff
    ]
    for session_id in expired_sessions:
        del sessions_db[session_id]
