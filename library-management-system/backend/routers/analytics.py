"""Analytics endpoints (Phase 2).

Reads pre-aggregated tables populated by the ETL pipeline. If a request hits an
empty aggregate (ETL never run), the response is simply an empty list — the
client should prompt the user to run the ETL.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

import models
import schemas
from config import settings
from database import get_db


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/popular-books", response_model=List[schemas.PopularBookOut])
def popular_books(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = (
        select(models.AggPopularBook)
        .order_by(models.AggPopularBook.borrow_count.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


@router.get("/category-borrowing", response_model=List[schemas.CategoryBorrowingOut])
def category_borrowing(db: Session = Depends(get_db)):
    stmt = (
        select(models.AggCategoryBorrowing)
        .order_by(models.AggCategoryBorrowing.borrow_count.desc())
    )
    return list(db.scalars(stmt).all())


@router.get("/monthly-trends", response_model=List[schemas.MonthlyTrendOut])
def monthly_trends(
    months: int = Query(12, ge=1, le=60),
    db: Session = Depends(get_db),
):
    rows = list(
        db.scalars(
            select(models.AggMonthlyTrend).order_by(models.AggMonthlyTrend.month.desc())
        ).all()
    )
    # Most-recent N, then sorted ascending for chart-friendly output
    rows = rows[:months]
    rows.sort(key=lambda r: r.month)
    return rows


@router.get("/overdue", response_model=schemas.OverdueReport)
def overdue(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Live computation of overdue items (not aggregated — needs current 'now')."""
    summary = db.scalar(select(models.AggOverdueSummary).limit(1))

    now = datetime.now(timezone.utc)
    cutoff_secs = settings.loan_days * 86400

    stmt = (
        select(models.Transaction)
        .where(models.Transaction.return_date.is_(None))
        .order_by(models.Transaction.borrow_date.asc())
    )
    items: List[schemas.OverdueTransactionOut] = []
    for t in db.scalars(stmt).all():
        # All datetimes from Postgres come back tz-aware
        delta = (now - t.borrow_date).total_seconds() - cutoff_secs
        if delta <= 0:
            continue
        items.append(
            schemas.OverdueTransactionOut(
                transaction_id=t.transaction_id,
                book_id=t.book_id,
                book_title=t.book.title if t.book else None,
                borrower_id=t.borrower_id,
                borrower_name=t.borrower.borrower_name if t.borrower else None,
                borrower_email=t.borrower.email if t.borrower else None,
                borrow_date=t.borrow_date,
                days_overdue=int(delta // 86400),
            )
        )
        if len(items) >= limit:
            break

    return schemas.OverdueReport(
        loan_days=settings.loan_days,
        open_overdue=summary.open_overdue if summary else len(items),
        returned_late=summary.returned_late if summary else 0,
        open_total=summary.open_total if summary else 0,
        computed_at=summary.computed_at if summary else None,
        items=items,
    )
