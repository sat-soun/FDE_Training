"""Transform stage — clean missing values, deduplicate, normalize types."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class TransformReport:
    """Counters returned by each transform function so the caller can log stats."""

    input_rows: int = 0
    output_rows: int = 0
    duplicates_removed: int = 0
    missing_required_dropped: int = 0
    cleaned_fields: int = 0
    notes: List[str] = field(default_factory=list)


def _strip(v: Any) -> str:
    """Return v as a stripped string, or '' if v is None."""
    if v is None:
        return ""
    return str(v).strip()


def _parse_dt(value: str) -> Optional[datetime]:
    """Best-effort datetime parser. Returns None if value is empty/invalid."""
    if not value:
        return None
    value = value.strip()
    # ISO with possible timezone
    try:
        # Allow trailing 'Z'
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
    except ValueError:
        pass
    # Common alternative format
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def transform_books(rows: List[Dict[str, str]]) -> tuple[List[Dict[str, Any]], TransformReport]:
    rep = TransformReport(input_rows=len(rows))
    seen_isbns: set[str] = set()
    out: List[Dict[str, Any]] = []
    for r in rows:
        title = _strip(r.get("title"))
        author = _strip(r.get("author"))
        category = _strip(r.get("category"))
        isbn = _strip(r.get("isbn"))

        if not (title and author and category and isbn):
            rep.missing_required_dropped += 1
            continue
        if isbn in seen_isbns:
            rep.duplicates_removed += 1
            continue
        seen_isbns.add(isbn)

        original_isbn = r.get("isbn") or ""
        if original_isbn != isbn:
            rep.cleaned_fields += 1

        out.append({"title": title, "author": author, "category": category, "isbn": isbn})
    rep.output_rows = len(out)
    return out, rep


def transform_borrowers(rows: List[Dict[str, str]]) -> tuple[List[Dict[str, Any]], TransformReport]:
    rep = TransformReport(input_rows=len(rows))
    seen_emails: set[str] = set()
    out: List[Dict[str, Any]] = []
    for r in rows:
        name = _strip(r.get("borrower_name"))
        email = _strip(r.get("email")).lower()
        phone = _strip(r.get("phone"))

        if not (name and email and phone):
            rep.missing_required_dropped += 1
            continue
        if email in seen_emails:
            rep.duplicates_removed += 1
            continue
        seen_emails.add(email)

        out.append({"borrower_name": name, "email": email, "phone": phone})
    rep.output_rows = len(out)
    return out, rep


def transform_transactions(rows: List[Dict[str, str]]) -> tuple[List[Dict[str, Any]], TransformReport]:
    rep = TransformReport(input_rows=len(rows))
    seen_keys: set[tuple] = set()
    out: List[Dict[str, Any]] = []
    for r in rows:
        isbn = _strip(r.get("book_isbn"))
        email = _strip(r.get("borrower_email")).lower()
        borrow_raw = _strip(r.get("borrow_date"))
        return_raw = _strip(r.get("return_date"))

        if not (isbn and email and borrow_raw):
            rep.missing_required_dropped += 1
            continue

        borrow_dt = _parse_dt(borrow_raw)
        if borrow_dt is None:
            rep.missing_required_dropped += 1
            continue
        return_dt = _parse_dt(return_raw) if return_raw else None

        key = (isbn, email, borrow_dt)
        if key in seen_keys:
            rep.duplicates_removed += 1
            continue
        seen_keys.add(key)

        # Track whitespace-stripped fields as a "cleaned" signal.
        if (r.get("book_isbn") or "") != isbn or (r.get("borrower_email") or "") != email:
            rep.cleaned_fields += 1

        out.append({
            "book_isbn": isbn,
            "borrower_email": email,
            "borrow_date": borrow_dt,
            "return_date": return_dt,
        })
    rep.output_rows = len(out)
    return out, rep
