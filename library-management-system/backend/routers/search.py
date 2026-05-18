"""Search endpoint."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db


router = APIRouter(tags=["search"])


@router.get("/search", response_model=List[schemas.BookOut])
def search_books(
    q: Optional[str] = Query(None, description="Keyword across title/author/category/isbn"),
    title: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Search books by keyword, or filter by title / author / category."""
    return crud.search_books(db, q=q, title=title, author=author, category=category)
