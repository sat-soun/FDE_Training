"""
ETL Service — Phase 2
Extract → Transform → Load feedback data from CSV / Excel files.
"""

import io
import logging
from datetime import datetime
from typing import Tuple

import pandas as pd
from sqlalchemy.orm import Session

import models

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────

REQUIRED_COLUMNS = {"participant_name", "program_name", "rating"}
VALID_RATING_RANGE = (1, 5)


# ── Extract ────────────────────────────────────────────────────────────────────

def extract(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Read CSV or Excel bytes into a DataFrame."""
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext in ("xls", "xlsx"):
        df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    elif ext == "csv":
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        raise ValueError(f"Unsupported file type: .{ext}. Please upload a .csv or .xlsx file.")

    # Normalise column names: strip whitespace and lowercase
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


# ── Transform ──────────────────────────────────────────────────────────────────

def transform(df: pd.DataFrame) -> Tuple[pd.DataFrame, int, int]:
    """
    Clean and validate the raw DataFrame.

    Returns:
        (clean_df, skipped_invalid_count, skipped_duplicate_count)
    """
    initial_count = len(df)

    # 1. Check required columns exist
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # 2. Standardise string fields
    for col in ("participant_name", "program_name", "comments"):
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({"nan": None, "": None})

    # 3. Coerce rating to numeric — drop non-numeric
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")

    # 4. Drop rows where required fields are null/empty
    before_required_drop = len(df)
    df = df.dropna(subset=["participant_name", "program_name", "rating"])
    df = df[df["participant_name"].astype(str).str.strip() != ""]
    df = df[df["program_name"].astype(str).str.strip() != ""]
    after_required_drop = len(df)

    # 5. Clamp ratings that are out of range (0 → drop; >5 → drop)
    #    Records with ratings < 1 or > 5 are invalid; log and discard.
    valid_rating_mask = df["rating"].between(VALID_RATING_RANGE[0], VALID_RATING_RANGE[1])
    df = df[valid_rating_mask]
    df["rating"] = df["rating"].astype(int)

    skipped_invalid = initial_count - len(df)

    # 6. Handle submitted_date — default to now() if missing or unparseable
    if "submitted_date" in df.columns:
        df["submitted_at"] = pd.to_datetime(df["submitted_date"], errors="coerce")
        df["submitted_at"] = df["submitted_at"].where(
            df["submitted_at"].notna(), other=pd.Timestamp(datetime.utcnow())
        )
    else:
        df["submitted_at"] = pd.Timestamp(datetime.utcnow())

    # 7. Remove duplicates (same participant_name + program_name + rating + submitted_at date)
    df["_dedup_key"] = (
        df["participant_name"].str.lower()
        + "|"
        + df["program_name"].str.lower()
        + "|"
        + df["rating"].astype(str)
        + "|"
        + df["submitted_at"].dt.date.astype(str)
    )
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["_dedup_key"])
    skipped_duplicates = before_dedup - len(df)
    df = df.drop(columns=["_dedup_key"])

    # Keep only the columns we need
    keep = ["participant_name", "program_name", "rating", "comments", "submitted_at"]
    df = df[[c for c in keep if c in df.columns]]

    logger.info(
        "Transform complete: %d valid rows, %d invalid dropped, %d duplicates dropped",
        len(df), skipped_invalid, skipped_duplicates,
    )
    return df, skipped_invalid, skipped_duplicates


# ── Load ───────────────────────────────────────────────────────────────────────

def load(df: pd.DataFrame, db: Session) -> int:
    """Insert transformed rows into the feedback table. Returns count inserted."""
    inserted = 0
    for _, row in df.iterrows():
        feedback = models.Feedback(
            participant_name=row["participant_name"],
            program_name=row["program_name"],
            rating=int(row["rating"]),
            comments=row.get("comments") if pd.notna(row.get("comments")) else None,
            submitted_at=row["submitted_at"].to_pydatetime() if hasattr(row["submitted_at"], "to_pydatetime") else row["submitted_at"],
        )
        db.add(feedback)
        inserted += 1

    db.commit()
    return inserted


# ── Orchestrator ───────────────────────────────────────────────────────────────

def run_etl(file_bytes: bytes, filename: str, db: Session, etl_run: models.ETLRun) -> models.ETLRun:
    """
    Full ETL pipeline. Updates the ETLRun record in-place and returns it.
    """
    try:
        # Extract
        raw_df = extract(file_bytes, filename)
        etl_run.total_records = len(raw_df)

        # Transform
        clean_df, skipped_invalid, skipped_duplicates = transform(raw_df)
        etl_run.skipped_invalid = skipped_invalid
        etl_run.skipped_duplicates = skipped_duplicates

        # Load
        imported = load(clean_df, db)
        etl_run.imported_records = imported
        etl_run.status = "success"

    except Exception as exc:
        logger.exception("ETL pipeline failed for %s", filename)
        etl_run.status = "failed"
        etl_run.error_message = str(exc)
        db.commit()
        raise

    db.add(etl_run)
    db.commit()
    db.refresh(etl_run)
    return etl_run
