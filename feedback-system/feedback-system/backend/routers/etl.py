"""
ETL Router — Phase 2
Endpoints for file upload, ETL triggering, analytics, and report download.
"""

import csv
import io
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

import models
import etl_service
from database import get_db
from schemas import (
    AnalyticsResponse,
    ETLRunListResponse,
    ETLRunResponse,
    ProgramAnalytics,
    TrendPoint,
)

router = APIRouter(prefix="/etl", tags=["ETL"])

ALLOWED_EXTENSIONS = {"csv", "xls", "xlsx"}


def _check_extension(filename: str):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Upload a .csv or .xlsx file.",
        )


# ── POST /etl/upload ───────────────────────────────────────────────────────────

@router.post("/upload", response_model=ETLRunResponse, status_code=201)
async def upload_and_run_etl(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV or Excel file and run the ETL pipeline.
    The file is validated, cleaned, and loaded into the feedback table.
    An ETLRun record is returned with import statistics.
    """
    _check_extension(file.filename)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Create an ETLRun record immediately so the user can see it
    etl_run = models.ETLRun(filename=file.filename, status="pending")
    db.add(etl_run)
    db.commit()
    db.refresh(etl_run)

    # Run the pipeline (updates etl_run in-place)
    etl_run = etl_service.run_etl(file_bytes, file.filename, db, etl_run)
    return etl_run


# ── GET /etl/runs ──────────────────────────────────────────────────────────────

@router.get("/runs", response_model=ETLRunListResponse)
def list_etl_runs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Return a paginated list of past ETL pipeline runs, newest first."""
    q = db.query(models.ETLRun).order_by(models.ETLRun.created_at.desc())
    total = q.count()
    runs = q.offset(skip).limit(limit).all()
    return {"total": total, "runs": runs}


# ── GET /etl/analytics ─────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    """
    Compute summary analytics from the feedback table:
    - Overall totals and average rating
    - Per-program breakdown
    - Monthly trend (last 12 months)
    - Top and bottom rated programs
    """
    all_feedback = db.query(models.Feedback).all()

    if not all_feedback:
        return AnalyticsResponse(
            overall_total=0,
            overall_average_rating=0.0,
            by_program=[],
            monthly_trend=[],
            top_program=None,
            bottom_program=None,
        )

    overall_total = len(all_feedback)
    overall_avg = round(sum(f.rating for f in all_feedback) / overall_total, 2)

    # Group by program
    program_map: dict[str, list] = defaultdict(list)
    for f in all_feedback:
        program_map[f.program_name].append(f)

    by_program: List[ProgramAnalytics] = []
    for prog, records in program_map.items():
        avg = round(sum(r.rating for r in records) / len(records), 2)
        dist = defaultdict(int)
        for r in records:
            dist[str(r.rating)] += 1
        by_program.append(
            ProgramAnalytics(
                program_name=prog,
                total_feedback=len(records),
                average_rating=avg,
                rating_distribution=dict(dist),
            )
        )

    by_program.sort(key=lambda x: x.program_name)

    # Top / bottom
    top = max(by_program, key=lambda x: x.average_rating).program_name
    bottom = min(by_program, key=lambda x: x.average_rating).program_name

    # Monthly trend
    monthly: dict[str, dict] = defaultdict(lambda: {"total": 0, "sum": 0})
    for f in all_feedback:
        key = f.submitted_at.strftime("%Y-%m")
        monthly[key]["total"] += 1
        monthly[key]["sum"] += f.rating

    monthly_trend = [
        TrendPoint(
            month=k,
            total_feedback=v["total"],
            average_rating=round(v["sum"] / v["total"], 2),
        )
        for k, v in sorted(monthly.items())
    ]

    return AnalyticsResponse(
        overall_total=overall_total,
        overall_average_rating=overall_avg,
        by_program=by_program,
        monthly_trend=monthly_trend,
        top_program=top,
        bottom_program=bottom,
    )


# ── GET /etl/report/download ───────────────────────────────────────────────────

@router.get("/report/download")
def download_report(db: Session = Depends(get_db)):
    """
    Download all feedback data as a CSV report.
    """
    feedbacks = db.query(models.Feedback).order_by(models.Feedback.submitted_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["feedback_id", "participant_name", "program_name", "rating", "comments", "submitted_at"])
    for f in feedbacks:
        writer.writerow([
            f.feedback_id,
            f.participant_name,
            f.program_name,
            f.rating,
            f.comments or "",
            f.submitted_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=feedback_report.csv"},
    )
