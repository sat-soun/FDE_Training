"""Borrow / return / transactions / dashboard endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db


router = APIRouter(tags=["transactions"])


@router.post("/borrow", response_model=schemas.TransactionOut)
def borrow_book(payload: schemas.BorrowRequest, db: Session = Depends(get_db)):
    return crud.borrow_book(db, payload)


@router.post("/return", response_model=schemas.TransactionOut)
def return_book(payload: schemas.ReturnRequest, db: Session = Depends(get_db)):
    return crud.return_book(db, payload)


@router.get("/transactions", response_model=List[schemas.TransactionDetailOut])
def list_transactions(db: Session = Depends(get_db)):
    rows = crud.list_transactions(db)
    out: List[schemas.TransactionDetailOut] = []
    for t in rows:
        out.append(
            schemas.TransactionDetailOut(
                transaction_id=t.transaction_id,
                book_id=t.book_id,
                borrower_id=t.borrower_id,
                borrow_date=t.borrow_date,
                return_date=t.return_date,
                book_title=t.book.title if t.book else None,
                borrower_name=t.borrower.borrower_name if t.borrower else None,
            )
        )
    return out


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard(db: Session = Depends(get_db)):
    return crud.dashboard_stats(db)
