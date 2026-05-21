from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List, Literal
from enum import Enum

from app.schemas.exercise import ExerciseResponse

class TrainingType(str, Enum):
    Pool = 'Pool'
    Depth = 'Depth'
    Gym = 'Gym'
    Other = 'Other'

class TrainingBase(BaseModel):
    type: TrainingType
    date: date
    difficulty: int = Field(..., ge=1, le=5)
    notes: Optional[str] = Field(None, max_length=500)

    poolTraining: Optional[dict] = Field(None)
    depthTraining: Optional[dict] = Field(None)
    gymTraining: Optional[dict] = Field(None)

class TrainingCreate(TrainingBase):
    pass

class TrainingUpdate(TrainingBase):
    pass

class TrainingResponse(TrainingBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class TrainingWithExercises(TrainingResponse):
    exercises: List[ExerciseResponse] = []