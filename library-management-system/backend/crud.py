"""Database access functions (thin layer over SQLAlchemy)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas


# ============================ Books ============================


def list_books(db: Session) -> List[models.Book]:
    return list(db.scalars(select(models.Book).order_by(models.Book.book_id)).all())


def get_book(db: Session, book_id: int) -> models.Book:
    book = db.get(models.Book, book_id)
    if book is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Book {book_id} not found"
        )
    return book


def create_book(db: Session, data: schemas.BookCreate) -> models.Book:
    book = models.Book(
        title=data.title,
        author=data.author,
        category=data.category,
        isbn=data.isbn,
        availability_status=models.AvailabilityStatus.AVAILABLE,
    )
    db.add(book)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A book with ISBN '{data.isbn}' already exists",
        )
    db.refresh(book)
    return book


def update_book(db: Session, book_id: int, data: schemas.BookUpdate) -> models.Book:
    book = get_book(db, book_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Update violates a uniqueness constraint (likely ISBN)",
        )
    db.refresh(book)
    return book


def delete_book(db: Session, book_id: int) -> None:
    book = get_book(db, book_id)
    db.delete(book)
    db.commit()


def search_books(
    db: Session,
    q: Optional[str] = None,
    title: Optional[str] = None,
    author: Optional[str] = None,
    category: Optional[str] = None,
) -> List[models.Book]:
    stmt = select(models.Book)

    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                models.Book.title.ilike(like),
                models.Book.author.ilike(like),
                models.Book.category.ilike(like),
                models.Book.isbn.ilike(like),
            )
        )
    if title:
        stmt = stmt.where(models.Book.title.ilike(f"%{title}%"))
    if author:
        stmt = stmt.where(models.Book.author.ilike(f"%{author}%"))
    if category:
        stmt = stmt.where(models.Book.category.ilike(f"%{category}%"))

    stmt = stmt.order_by(models.Book.title)
    return list(db.scalars(stmt).all())


# ============================ Borrowers ============================


def list_borrowers(db: Session) -> List[models.Borrower]:
    return list(
        db.scalars(select(models.Borrower).order_by(models.Borrower.borrower_id)).all()
    )


def get_borrower(db: Session, borrower_id: int) -> models.Borrower:
    b = db.get(models.Borrower, borrower_id)
    if b is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Borrower {borrower_id} not found",
        )
    return b


def create_borrower(db: Session, data: schemas.BorrowerCreate) -> models.Borrower:
    borrower = models.Borrower(
        borrower_name=data.borrower_name,
        email=str(data.email),
        phone=data.phone,
    )
    db.add(borrower)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A borrower with email '{data.email}' already exists",
        )
    db.refresh(borrower)
    return borrower


def update_borrower(
    db: Session, borrower_id: int, data: schemas.BorrowerUpdate
) -> models.Borrower:
    borrower = get_borrower(db, borrower_id)
    payload = data.model_dump(exclude_unset=True)
    if "email" in payload and payload["email"] is not None:
        payload["email"] = str(payload["email"])
    for field, value in payload.items():
        setattr(borrower, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Update violates a uniqueness constraint (likely email)",
        )
    db.refresh(borrower)
    return borrower


def delete_borrower(db: Session, borrower_id: int) -> None:
    borrower = get_borrower(db, borrower_id)
    db.delete(borrower)
    db.commit()


# ============================ Transactions ============================


def borrow_book(db: Session, payload: schemas.BorrowRequest) -> models.Transaction:
    book = get_book(db, payload.book_id)
    borrower = get_borrower(db, payload.borrower_id)

    if book.availability_status != models.AvailabilityStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Book '{book.title}' is currently not available",
        )

    txn = models.Transaction(
        book_id=book.book_id,
        borrower_id=borrower.borrower_id,
        borrow_date=datetime.now(timezone.utc),
        return_date=None,
    )
    book.availability_status = models.AvailabilityStatus.BORROWED

    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def return_book(db: Session, payload: schemas.ReturnRequest) -> models.Transaction:
    txn = db.get(models.Transaction, payload.transaction_id)
    if txn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {payload.transaction_id} not found",
        )
    if txn.return_date is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This transaction has already been returned",
        )

    txn.return_date = datetime.now(timezone.utc)
    book = db.get(models.Book, txn.book_id)
    if book is not None:
        book.availability_status = models.AvailabilityStatus.AVAILABLE

    db.commit()
    db.refresh(txn)
    return txn


def list_transactions(db: Session) -> List[models.Transaction]:
    return list(
        db.scalars(
            select(models.Transaction).order_by(models.Transaction.transaction_id.desc())
        ).all()
    )


def dashboard_stats(db: Session) -> schemas.DashboardStats:
    total_books = db.query(models.Book).count()
    borrowed_books = (
        db.query(models.Book)
        .filter(models.Book.availability_status == models.AvailabilityStatus.BORROWED)
        .count()
    )
    available_books = total_books - borrowed_books
    total_borrowers = db.query(models.Borrower).count()
    open_transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.return_date.is_(None))
        .count()
    )
    return schemas.DashboardStats(
        total_books=total_books,
        available_books=available_books,
        borrowed_books=borrowed_books,
        total_borrowers=total_borrowers,
        open_transactions=open_transactions,
    )
