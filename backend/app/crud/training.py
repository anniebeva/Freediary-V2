from typing import List, Optional

import app.models.memory_storage as storage
from app.models.memory_storage import Training
from app.schemas.training import TrainingCreate, TrainingUpdate


def get_trainings() -> List[Training]:
    return list(storage.trainings_db.values())


def get_training_by_id(training_id: int) -> Optional[Training]:
    return storage.trainings_db.get(training_id)


def get_trainings_by_user_id(user_id: int) -> List[Training]:
    return [
        training
        for training in storage.trainings_db.values()
        if training.user_id == user_id
    ]


def create_training(training_data: TrainingCreate, user_id: int) -> Optional[Training]:
    # Allow training creation for guest users (user_id = 0)
    if user_id != 0 and user_id not in storage.users_db:
        return None

    storage.training_counter += 1

    training = Training(
        user_id=user_id,
        type=training_data.type,
        date=training_data.date,
        difficulty=training_data.difficulty,
        notes=training_data.notes,
        pool_training=training_data.poolTraining,
        depth_training=training_data.depthTraining,
        gym_training=training_data.gymTraining,
    )
    training.id = storage.training_counter

    storage.trainings_db[training.id] = training

    return training


def update_training(training_id: int, training_data: TrainingUpdate) -> Optional[Training]:
    training = get_training_by_id(training_id)

    if training is None:
        return None

    training.type = training_data.type
    training.date = training_data.date
    training.difficulty = training_data.difficulty
    training.notes = training_data.notes
    training.pool_training = training_data.poolTraining
    training.depth_training = training_data.depthTraining
    training.gym_training = training_data.gymTraining

    return training


def delete_training(training_id: int) -> bool:
    if training_id not in storage.trainings_db:
        return False

    training_exercises = [
        exercise_id
        for exercise_id, exercise in storage.exercises_db.items()
        if exercise.training_id == training_id
    ]

    for exercise_id in training_exercises:
        del storage.exercises_db[exercise_id]

    del storage.trainings_db[training_id]

    return True


def is_training_owner(training_id: int, user_id: int) -> bool:
    training = get_training_by_id(training_id)

    if training is None:
        return False

    return training.user_id == user_id