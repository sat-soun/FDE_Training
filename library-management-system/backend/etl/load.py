"""Load stage — upsert dimension rows, then rebuild aggregate (analytics) tables."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

import models
from config import settings


# -------------------- dimension upserts --------------------


def upsert_books(db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
    """Insert or update books keyed by ISBN. Returns counts."""
    inserted = updated = 0
    for r in rows:
        existing = db.scalar(select(models.Book).where(models.Book.isbn == r["isbn"]))
        if existing is None:
            db.add(models.Book(
                title=r["title"], author=r["author"],
                category=r["category"], isbn=r["isbn"],
                availability_status=models.AvailabilityStatus.AVAILABLE,
            ))
            inserted += 1
        else:
            existing.title = r["title"]
            existing.author = r["author"]
            existing.category = r["category"]
            updated += 1
    db.commit()
    return {"inserted": inserted, "updated": updated}


def upsert_borrowers(db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
    inserted = updated = 0
    for r in rows:
        existing = db.scalar(
            select(models.Borrower).where(models.Borrower.email == r["email"])
        )
        if existing is None:
            db.add(models.Borrower(
                borrower_name=r["borrower_name"], email=r["email"], phone=r["phone"]
            ))
            inserted += 1
        else:
            existing.borrower_name = r["borrower_name"]
            existing.phone = r["phone"]
            updated += 1
    db.commit()
    return {"inserted": inserted, "updated": updated}


def upsert_transactions(db: Session, rows: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Transactions are resolved by (book_isbn -> book_id) and (borrower_email -> borrower_id).
    Idempotency key: (book_id, borrower_id, borrow_date).
    """
    inserted = updated = skipped = 0

    # Build lookup maps once
    book_map = {b.isbn: b.book_id for b in db.scalars(select(models.Book)).all()}
    bor_map = {b.email: b.borrower_id for b in db.scalars(select(models.Borrower)).all()}

    # Keep track of which books should end up "borrowed" (any open txn after load)
    open_book_ids: set[int] = set()
    closed_book_ids: set[int] = set()

    for r in rows:
        book_id = book_map.get(r["book_isbn"])
        bor_id = bor_map.get(r["borrower_email"])
        if not book_id or not bor_id:
            skipped += 1
            continue

        # Normalize timezone-naive datetimes to UTC for consistent comparisons
        borrow_dt = r["borrow_date"]
        if borrow_dt.tzinfo is None:
            borrow_dt = borrow_dt.replace(tzinfo=timezone.utc)
        return_dt = r["return_date"]
        if return_dt is not None and return_dt.tzinfo is None:
            return_dt = return_dt.replace(tzinfo=timezone.utc)

        existing = db.scalar(
            select(models.Transaction).where(
                models.Transaction.book_id == book_id,
                models.Transaction.borrower_id == bor_id,
                models.Transaction.borrow_date == borrow_dt,
            )
        )
        if existing is None:
            db.add(models.Transaction(
                book_id=book_id, borrower_id=bor_id,
                borrow_date=borrow_dt, return_date=return_dt,
            ))
            inserted += 1
        else:
            existing.return_date = return_dt
            updated += 1

        if return_dt is None:
            open_book_ids.add(book_id)
        else:
            closed_book_ids.add(book_id)

    db.commit()

    # Reconcile each book's availability_status with its open transactions.
    if open_book_ids:
        db.query(models.Book).filter(models.Book.book_id.in_(open_book_ids)).update(
            {models.Book.availability_status: models.AvailabilityStatus.BORROWED},
            synchronize_session=False,
        )
    # Books that only had closed transactions in this batch flip back to available
    only_closed = closed_book_ids - open_book_ids
    if only_closed:
        db.query(models.Book).filter(models.Book.book_id.in_(only_closed)).update(
            {models.Book.availability_status: models.AvailabilityStatus.AVAILABLE},
            synchronize_session=False,
        )
    db.commit()
    return {"inserted": inserted, "updated": updated, "skipped": skipped}


# -------------------- analytics aggregates --------------------


def rebuild_aggregates(db: Session) -> Dict[str, int]:
    """
    Rebuild every analytics table from scratch off the current transactions.
    Cheap to run because the cardinality is small for a library catalogue.
    """
    counts: Dict[str, int] = {}

    # Purge previous aggregates
    db.execute(delete(models.AggPopularBook))
    db.execute(delete(models.AggCategoryBorrowing))
    db.execute(delete(models.AggMonthlyTrend))
    db.commit()

    now = datetime.now(timezone.utc)
    loan_cutoff = now - timedelta(days=settings.loan_days)

    # ---- Popular books: top-N by total borrows ----
    stmt = (
        select(
            models.Book.book_id,
            models.Book.title,
            models.Book.author,
            models.Book.category,
            func.count(models.Transaction.transaction_id).label("borrow_count"),
        )
        .join(models.Transaction, models.Transaction.book_id == models.Book.book_id)
        .group_by(models.Book.book_id, models.Book.title, models.Book.author, models.Book.category)
        .order_by(func.count(models.Transaction.transaction_id).desc())
    )
    for row in db.execute(stmt).all():
        db.add(models.AggPopularBook(
            book_id=row.book_id, title=row.title, author=row.author,
            category=row.category, borrow_count=row.borrow_count,
        ))
    db.commit()
    counts["popular_books"] = db.query(models.AggPopularBook).count()

    # ---- Category borrowing: count of txns per category ----
    stmt = (
        select(
            models.Book.category,
            func.count(models.Transaction.transaction_id).label("borrow_count"),
        )
        .join(models.Transaction, models.Transaction.book_id == models.Book.book_id)
        .group_by(models.Book.category)
        .order_by(func.count(models.Transaction.transaction_id).desc())
    )
    for row in db.execute(stmt).all():
        db.add(models.AggCategoryBorrowing(
            category=row.category, borrow_count=row.borrow_count,
        ))
    db.commit()
    counts["categories"] = db.query(models.AggCategoryBorrowing).count()

    # ---- Monthly trends: borrows per YYYY-MM ----
    stmt = select(models.Transaction.borrow_date)
    by_month: Dict[str, int] = {}
    for (dt,) in db.execute(stmt).all():
        if dt is None:
            continue
        key = dt.strftime("%Y-%m")
        by_month[key] = by_month.get(key, 0) + 1
    for month_key in sorted(by_month):
        db.add(models.AggMonthlyTrend(month=month_key, borrow_count=by_month[month_key]))
    db.commit()
    counts["months"] = db.query(models.AggMonthlyTrend).count()

    # ---- Overdue counters (kept inline as a single row in AggOverdueSummary) ----
    db.execute(delete(models.AggOverdueSummary))
    overdue_open = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.return_date.is_(None),
            models.Transaction.borrow_date < loan_cutoff,
        )
        .count()
    )
    returned_late = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.return_date.isnot(None),
            func.date_part("day", models.Transaction.return_date - models.Transaction.borrow_date)
            > settings.loan_days,
        )
        .count()
    )
    total_open = (
        db.query(models.Transaction)
        .filter(models.Transaction.return_date.is_(None))
        .count()
    )
    db.add(models.AggOverdueSummary(
        loan_days=settings.loan_days,
        open_overdue=overdue_open,
        returned_late=returned_late,
        open_total=total_open,
        computed_at=now,
    ))
    db.commit()
    counts["overdue_summary"] = 1
    return counts
