"""Borrower endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db


router = APIRouter(prefix="/borrowers", tags=["borrowers"])


@router.get("", response_model=List[schemas.BorrowerOut])
def get_borrowers(db: Session = Depends(get_db)):
    return crud.list_borrowers(db)


@router.get("/{borrower_id}", response_model=schemas.BorrowerOut)
def get_borrower(borrower_id: int, db: Session = Depends(get_db)):
    return crud.get_borrower(db, borrower_id)


@router.post("", response_model=schemas.BorrowerOut, status_code=status.HTTP_201_CREATED)
def create_borrower(payload: schemas.BorrowerCreate, db: Session = Depends(get_db)):
    return crud.create_borrower(db, payload)


@router.put("/{borrower_id}", response_model=schemas.BorrowerOut)
def update_borrower(
    borrower_id: int,
    payload: schemas.BorrowerUpdate,
    db: Session = Depends(get_db),
):
    return crud.update_borrower(db, borrower_id, payload)


@router.delete("/{borrower_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_borrower(borrower_id: int, db: Session = Depends(get_db)):
    crud.delete_borrower(db, borrower_id)
    return None
