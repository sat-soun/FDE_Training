"""Extract stage — read raw CSVs from the data/ folder."""
from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List


def read_csv(path: Path) -> List[Dict[str, str]]:
    """Read a CSV into a list of dicts. Returns [] if the file does not exist."""
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def extract_all(data_dir: Path) -> Dict[str, List[Dict[str, str]]]:
    """Pull every dataset the ETL knows how to load."""
    return {
        "books": read_csv(data_dir / "books.csv"),
        "borrowers": read_csv(data_dir / "borrowers.csv"),
        "transactions": read_csv(data_dir / "transactions.csv"),
    }
