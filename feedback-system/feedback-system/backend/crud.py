from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from models import Feedback
from schemas import FeedbackCreate, FeedbackUpdate
from typing import Optional
from fastapi import HTTPException


def get_feedback_by_id(db: Session, feedback_id: int) -> Feedback:
    feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail=f"Feedback with id {feedback_id} not found")
    return feedback


def get_all_feedback(db: Session, skip: int = 0, limit: int = 100) -> tuple[list[Feedback], int]:
    total = db.query(func.count(Feedback.feedback_id)).scalar()
    feedbacks = db.query(Feedback).order_by(Feedback.submitted_at.desc()).offset(skip).limit(limit).all()
    return feedbacks, total


def create_feedback(db: Session, feedback_data: FeedbackCreate) -> Feedback:
    feedback = Feedback(**feedback_data.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def update_feedback(db: Session, feedback_id: int, feedback_data: FeedbackUpdate) -> Feedback:
    feedback = get_feedback_by_id(db, feedback_id)
    update_data = feedback_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(feedback, key, value)
    db.commit()
    db.refresh(feedback)
    return feedback


def delete_feedback(db: Session, feedback_id: int) -> dict:
    feedback = get_feedback_by_id(db, feedback_id)
    db.delete(feedback)
    db.commit()
    return {"message": f"Feedback {feedback_id} deleted successfully"}


def search_feedback(
    db: Session,
    keyword: Optional[str] = None,
    rating: Optional[int] = None,
    program_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Feedback], int]:
    query = db.query(Feedback)

    if keyword:
        keyword_filter = f"%{keyword}%"
        query = query.filter(
            or_(
                Feedback.participant_name.ilike(keyword_filter),
                Feedback.program_name.ilike(keyword_filter),
                Feedback.comments.ilike(keyword_filter),
            )
        )

    if rating is not None:
        query = query.filter(Feedback.rating == rating)

    if program_name:
        query = query.filter(Feedback.program_name.ilike(f"%{program_name}%"))

    total = query.with_entities(func.count(Feedback.feedback_id)).scalar()
    feedbacks = query.order_by(Feedback.submitted_at.desc()).offset(skip).limit(limit).all()
    return feedbacks, total


def get_stats(db: Session) -> dict:
    total = db.query(func.count(Feedback.feedback_id)).scalar() or 0
    avg = db.query(func.avg(Feedback.rating)).scalar() or 0.0

    distribution = {}
    rating_labels = {1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent"}
    for r in range(1, 6):
        count = db.query(func.count(Feedback.feedback_id)).filter(Feedback.rating == r).scalar() or 0
        distribution[rating_labels[r]] = count

    return {
        "total_feedback": total,
        "average_rating": round(float(avg), 2),
        "rating_distribution": distribution,
    }
