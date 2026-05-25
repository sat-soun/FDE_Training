from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List


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


# ── ETL Schemas ────────────────────────────────────────────────────────────────

class ETLRunResponse(BaseModel):
    id: int
    filename: str
    status: str
    total_records: int
    imported_records: int
    skipped_duplicates: int
    skipped_invalid: int
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ETLRunListResponse(BaseModel):
    total: int
    runs: List[ETLRunResponse]


# ── Analytics Schemas ──────────────────────────────────────────────────────────

class ProgramAnalytics(BaseModel):
    program_name: str
    total_feedback: int
    average_rating: float
    rating_distribution: dict[str, int]


class TrendPoint(BaseModel):
    month: str          # e.g. "2024-03"
    total_feedback: int
    average_rating: float


class AnalyticsResponse(BaseModel):
    overall_total: int
    overall_average_rating: float
    by_program: List[ProgramAnalytics]
    monthly_trend: List[TrendPoint]
    top_program: Optional[str]
    bottom_program: Optional[str]
