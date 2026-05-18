"""Pydantic schemas for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------------------- Book -----------------------------


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    isbn: str = Field(..., min_length=1, max_length=32)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    isbn: Optional[str] = Field(None, min_length=1, max_length=32)
    availability_status: Optional[str] = Field(None, max_length=20)


class BookOut(BookBase):
    model_config = ConfigDict(from_attributes=True)

    book_id: int
    availability_status: str
    created_at: datetime


# ----------------------------- Borrower -----------------------------


class BorrowerBase(BaseModel):
    borrower_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=4, max_length=32)


class BorrowerCreate(BorrowerBase):
    pass


class BorrowerUpdate(BaseModel):
    borrower_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=4, max_length=32)


class BorrowerOut(BorrowerBase):
    model_config = ConfigDict(from_attributes=True)

    borrower_id: int
    created_at: datetime


# ----------------------------- Transactions -----------------------------


class BorrowRequest(BaseModel):
    book_id: int
    borrower_id: int


class ReturnRequest(BaseModel):
    transaction_id: int


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transaction_id: int
    book_id: int
    borrower_id: int
    borrow_date: datetime
    return_date: Optional[datetime] = None


class TransactionDetailOut(TransactionOut):
    """Transaction enriched with book + borrower details for the UI."""

    book_title: Optional[str] = None
    borrower_name: Optional[str] = None


# ----------------------------- Dashboard -----------------------------


class DashboardStats(BaseModel):
    total_books: int
    available_books: int
    borrowed_books: int
    total_borrowers: int
    open_transactions: int
