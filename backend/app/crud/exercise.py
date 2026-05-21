from typing import List, Optional

import app.models.memory_storage as storage
from app.models.memory_storage import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate


def get_exercises() -> List[Exercise]:
    return list(storage.exercises_db.values())


def get_exercise_by_id(exercise_id: int) -> Optional[Exercise]:
    return storage.exercises_db.get(exercise_id)


def get_exercises_by_training_id(training_id: int) -> List[Exercise]:
    return [
        exercise
        for exercise in storage.exercises_db.values()
        if exercise.training_id == training_id
    ]


def create_exercise(exercise_data: ExerciseCreate) -> Optional[Exercise]:
    if exercise_data.training_id not in storage.trainings_db:
        return None

    storage.exercise_counter += 1

    exercise = Exercise(
        training_id=exercise_data.training_id,
        name=exercise_data.name,
        reps=exercise_data.reps,
        sets=exercise_data.sets,
        weight=exercise_data.weight,
    )
    exercise.id = storage.exercise_counter

    storage.exercises_db[exercise.id] = exercise

    return exercise


def update_exercise(exercise_id: int, exercise_data: ExerciseUpdate) -> Optional[Exercise]:
    exercise = get_exercise_by_id(exercise_id)

    if exercise is None:
        return None

    exercise.name = exercise_data.name
    exercise.reps = exercise_data.reps
    exercise.sets = exercise_data.sets
    exercise.weight = exercise_data.weight

    return exercise


def delete_exercise(exercise_id: int) -> bool:
    if exercise_id not in storage.exercises_db:
        return False

    del storage.exercises_db[exercise_id]

    return True


def is_exercise_training_owner(exercise_id: int, user_id: int) -> bool:
    exercise = get_exercise_by_id(exercise_id)

    if exercise is None:
        return False

    training = storage.trainings_db.get(exercise.training_id)

    if training is None:
        return False

    return training.user_id == user_id