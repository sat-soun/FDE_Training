"""ETL orchestrator. Runnable as a CLI: `python -m etl.run`."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine

from . import extract, transform, load


logger = logging.getLogger("etl")


def default_data_dir() -> Path:
    # backend/etl/run.py  -> backend/  -> repo/  -> repo/data
    return Path(__file__).resolve().parents[2] / "data"


def run_etl(data_dir: Optional[Path] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Run the full ETL pipeline. Returns a structured report.

    If `db` is None, opens its own session (typical for CLI use). If provided
    (e.g. from a FastAPI handler), the caller manages the session's lifetime.
    """
    data_dir = data_dir or default_data_dir()
    owns_session = db is None
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()

    try:
        # ---------- Extract ----------
        raw = extract.extract_all(data_dir)
        logger.info("extract: %s rows across %d datasets",
                    {k: len(v) for k, v in raw.items()}, len(raw))

        # ---------- Transform ----------
        books_clean,    rep_b = transform.transform_books(raw["books"])
        bor_clean,      rep_r = transform.transform_borrowers(raw["borrowers"])
        txn_clean,      rep_t = transform.transform_transactions(raw["transactions"])

        # ---------- Load ----------
        load_books = load.upsert_books(db, books_clean)
        load_bor   = load.upsert_borrowers(db, bor_clean)
        load_txn   = load.upsert_transactions(db, txn_clean)
        agg_counts = load.rebuild_aggregates(db)

        report = {
            "data_dir": str(data_dir),
            "extract": {
                "books": len(raw["books"]),
                "borrowers": len(raw["borrowers"]),
                "transactions": len(raw["transactions"]),
            },
            "transform": {
                "books": rep_b.__dict__,
                "borrowers": rep_r.__dict__,
                "transactions": rep_t.__dict__,
            },
            "load": {
                "books": load_books,
                "borrowers": load_bor,
                "transactions": load_txn,
                "aggregates": agg_counts,
            },
        }
        return report
    finally:
        if owns_session:
            db.close()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    report = run_etl()
    import json
    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    main()
