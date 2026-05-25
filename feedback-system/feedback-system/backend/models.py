from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    participant_name = Column(String(100), nullable=False)
    program_name = Column(String(200), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ETLRun(Base):
    __tablename__ = "etl_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending")   # pending | success | failed
    total_records = Column(Integer, default=0)
    imported_records = Column(Integer, default=0)
    skipped_duplicates = Column(Integer, default=0)
    skipped_invalid = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
