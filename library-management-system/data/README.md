# Sample Dataset

Three CSVs the ETL pipeline ingests on each run.

| File              | Columns                                                            | Rows |
|-------------------|--------------------------------------------------------------------|------|
| `books.csv`       | `title, author, category, isbn`                                    | 66   |
| `borrowers.csv`   | `borrower_name, email, phone`                                      | 40   |
| `transactions.csv`| `book_isbn, borrower_email, borrow_date, return_date`              | 123  |

Total: **229 records** (≥ 150 required by the Phase 2 spec).

## Linking strategy

`transactions.csv` references books by **ISBN** and borrowers by **email** rather than by surrogate IDs — the ETL resolves those lookups during the Load stage. This makes the CSVs portable across environments where IDs may differ.

## Dirty data (intentional)

A handful of rows in `transactions.csv` are intentionally malformed so the **Transform** stage has something to clean:

- One exact duplicate row → de-duplicated.
- One row with an empty `borrow_date` → dropped as invalid.
- One row with whitespace padding in the ISBN → trimmed during Transform.

The ETL run report tells you exactly how many rows were skipped or cleaned in each stage.

## Replacing with your own data

Drop CSVs at the same paths with the same column names and re-run `python -m etl.run`. The ETL is idempotent — books are upserted by ISBN, borrowers by email, and transactions are matched on `(book_id, borrower_id, borrow_date)`.
