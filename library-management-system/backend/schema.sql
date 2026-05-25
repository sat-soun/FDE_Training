-- Library Management System - PostgreSQL schema
-- The FastAPI app auto-creates these on startup via SQLAlchemy.
-- This file is provided for manual setup / reference.

CREATE TABLE IF NOT EXISTS books (
    book_id              SERIAL PRIMARY KEY,
    title                VARCHAR(255) NOT NULL,
    author               VARCHAR(255) NOT NULL,
    category             VARCHAR(100) NOT NULL,
    isbn                 VARCHAR(32)  NOT NULL UNIQUE,
    availability_status  VARCHAR(20)  NOT NULL DEFAULT 'available',
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_books_title    ON books (title);
CREATE INDEX IF NOT EXISTS idx_books_author   ON books (author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books (category);

CREATE TABLE IF NOT EXISTS borrowers (
    borrower_id    SERIAL PRIMARY KEY,
    borrower_name  VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    phone          VARCHAR(32)  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id  SERIAL PRIMARY KEY,
    book_id         INTEGER     NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    borrower_id     INTEGER     NOT NULL REFERENCES borrowers(borrower_id) ON DELETE CASCADE,
    borrow_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    return_date     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_txn_book     ON transactions (book_id);
CREATE INDEX IF NOT EXISTS idx_txn_borrower ON transactions (borrower_id);

-- ============================ Phase 2: Analytics Aggregates ============================
-- Populated by the ETL pipeline (`python -m etl.run` or POST /etl/run).
-- The /analytics endpoints read from these tables directly.

CREATE TABLE IF NOT EXISTS agg_popular_books (
    id            SERIAL PRIMARY KEY,
    book_id       INTEGER       NOT NULL,
    title         VARCHAR(255)  NOT NULL,
    author        VARCHAR(255)  NOT NULL,
    category      VARCHAR(100)  NOT NULL,
    borrow_count  INTEGER       NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_agg_pop_book_id ON agg_popular_books (book_id);

CREATE TABLE IF NOT EXISTS agg_category_borrowing (
    id            SERIAL PRIMARY KEY,
    category      VARCHAR(100)  NOT NULL UNIQUE,
    borrow_count  INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agg_monthly_trends (
    id            SERIAL PRIMARY KEY,
    month         VARCHAR(7)    NOT NULL UNIQUE,
    borrow_count  INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS agg_overdue_summary (
    id             SERIAL PRIMARY KEY,
    loan_days      INTEGER     NOT NULL,
    open_overdue   INTEGER     NOT NULL DEFAULT 0,
    returned_late  INTEGER     NOT NULL DEFAULT 0,
    open_total     INTEGER     NOT NULL DEFAULT 0,
    computed_at    TIMESTAMPTZ NOT NULL
);
