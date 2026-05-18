from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class FeedbackBase(BaseModel):
    participant_name: str = Field(..., min_length=1, max_length=100, description="Name of the participant")
    program_name: str = Field(..., min_length=1, max_length=200, description="Training/Event/Product name")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 (Poor) to 5 (Excellent)")
    comments: Optional[str] = Field(None, max_length=2000, description="Feedback comments")

    @field_validator("participant_name", "program_name")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackUpdate(BaseModel):
    participant_name: Optional[str] = Field(None, min_length=1, max_length=100)
    program_name: Optional[str] = Field(None, min_length=1, max_length=200)
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = Field(None, max_length=2000)

    @field_validator("participant_name", "program_name")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v


class FeedbackResponse(FeedbackBase):
    feedback_id: int
    submitted_at: datetime

    model_config = {"from_attributes": True}


class FeedbackListResponse(BaseModel):
    total: int
    feedbacks: list[FeedbackResponse]


class StatsResponse(BaseModel):
    total_feedback: int
    average_rating: float
    rating_distribution: dict[str, int]
