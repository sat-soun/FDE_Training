from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import crud
from schemas import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    FeedbackListResponse,
    StatsResponse,
)

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Get overall feedback statistics."""
    return crud.get_stats(db)


@router.get("", response_model=FeedbackListResponse)
def get_all_feedback(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve all feedback entries with pagination."""
    feedbacks, total = crud.get_all_feedback(db, skip=skip, limit=limit)
    return {"total": total, "feedbacks": feedbacks}


@router.get("/search", response_model=FeedbackListResponse)
def search_feedback(
    keyword: Optional[str] = Query(None, description="Keyword to search in name, program, comments"),
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by rating"),
    program_name: Optional[str] = Query(None, description="Filter by program/event name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Search and filter feedback entries."""
    feedbacks, total = crud.search_feedback(
        db, keyword=keyword, rating=rating, program_name=program_name, skip=skip, limit=limit
    )
    return {"total": total, "feedbacks": feedbacks}


@router.get("/{feedback_id}", response_model=FeedbackResponse)
def get_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific feedback entry by ID."""
    return crud.get_feedback_by_id(db, feedback_id)


@router.post("", response_model=FeedbackResponse, status_code=201)
def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    """Submit new feedback."""
    return crud.create_feedback(db, feedback)


@router.put("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(feedback_id: int, feedback: FeedbackUpdate, db: Session = Depends(get_db)):
    """Update an existing feedback entry."""
    return crud.update_feedback(db, feedback_id, feedback)


@router.delete("/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """Delete a feedback entry."""
    return crud.delete_feedback(db, feedback_id)
