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
