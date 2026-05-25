"""ETL trigger endpoint (Phase 2)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from etl.run import run_etl


router = APIRouter(prefix="/etl", tags=["etl"])


@router.post("/run")
def trigger_etl(db: Session = Depends(get_db)):
    """
    Run the full ETL pipeline against CSVs in ./data and rebuild analytics
    aggregates. Returns a JSON report with per-stage counts.
    """
    try:
        report = run_etl(db=db)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset file missing: {e}",
        )
    except Exception as e:  # noqa: BLE001 — surface unexpected ETL failures
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ETL failed: {e}",
        )
    return report
