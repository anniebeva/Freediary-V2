from typing import List, Optional

import app.models.memory_storage as storage
from app.core.security import get_password_hash
from app.models.memory_storage import User
from app.schemas.user import UserCreate


def get_users() -> List[User]:
    return list(storage.users_db.values())


def get_user_by_id(user_id: int) -> Optional[User]:
    return storage.users_db.get(user_id)


def get_user_by_email(email: str) -> Optional[User]:
    for user in storage.users_db.values():
        if user.email == email:
            return user
    return None


def get_user_by_username(username: str) -> Optional[User]:
    for user in storage.users_db.values():
        if user.username == username:
            return user
    return None


def create_user(user_data: UserCreate) -> User:
    storage.user_counter += 1

    user = User(
        username=user_data.username,
        email=user_data.email,
        password=get_password_hash(user_data.password),
    )
    user.id = storage.user_counter

    storage.users_db[user.id] = user

    return user


def delete_user(user_id: int) -> bool:
    if user_id not in storage.users_db:
        return False

    del storage.users_db[user_id]

    user_trainings = [
        training_id
        for training_id, training in storage.trainings_db.items()
        if training.user_id == user_id
    ]

    for training_id in user_trainings:
        training_exercises = [
            exercise_id
            for exercise_id, exercise in storage.exercises_db.items()
            if exercise.training_id == training_id
        ]

        for exercise_id in training_exercises:
            del storage.exercises_db[exercise_id]

        del storage.trainings_db[training_id]

    return True