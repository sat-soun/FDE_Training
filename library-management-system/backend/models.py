"""SQLAlchemy ORM models for the library."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class AvailabilityStatus:
    """Enum-like values for availability_status (kept as plain strings per the spec)."""

    AVAILABLE = "available"
    BORROWED = "borrowed"


class Book(Base):
    __tablename__ = "books"

    book_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    isbn: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    availability_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AvailabilityStatus.AVAILABLE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="book", cascade="all, delete-orphan"
    )


class Borrower(Base):
    __tablename__ = "borrowers"

    borrower_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    borrower_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="borrower", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.book_id", ondelete="CASCADE"), nullable=False, index=True
    )
    borrower_id: Mapped[int] = mapped_column(
        ForeignKey("borrowers.borrower_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    borrow_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    return_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    book: Mapped[Book] = relationship(back_populates="transactions")
    borrower: Mapped[Borrower] = relationship(back_populates="transactions")
