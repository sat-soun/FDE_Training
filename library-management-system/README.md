# Library Management System — Phases 1 & 2

A full-stack web application for managing books, borrowers, and borrow/return transactions in a library — plus an ETL pipeline and analytics layer for usage reporting. Built with **React** (frontend), **FastAPI** (backend), and **PostgreSQL** (database).

**Phase 1** covers book CRUD, borrower CRUD, borrow/return workflows, search, REST API design, CORS, Pydantic validation, exception handling, and a responsive React UI.

**Phase 2** adds an ETL pipeline that ingests book/borrower/transaction CSVs (with deduplication and missing-value handling), pre-aggregated analytics tables, four analytics REST endpoints (popular books, category trends, monthly trends, overdue analysis), and a new Analytics dashboard in the UI.

---

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Frontend    | React 18, React Router, Axios, Vite       |
| Backend     | Python 3.10+, FastAPI, SQLAlchemy 2.x     |
| Database    | PostgreSQL 13+                            |
| Validation  | Pydantic v2                               |

---

## Project Structure

```
library-management-system/
├── backend/
│   ├── main.py              # FastAPI app entrypoint
│   ├── config.py            # Settings loaded from .env (incl. LOAN_DAYS)
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models — core + analytics aggregates
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud.py              # Database access functions
│   ├── routers/
│   │   ├── books.py
│   │   ├── borrowers.py
│   │   ├── transactions.py  # /borrow, /return, /transactions, /dashboard
│   │   ├── search.py
│   │   ├── analytics.py     # /analytics/*       (Phase 2)
│   │   └── etl.py           # POST /etl/run      (Phase 2)
│   ├── etl/                 # ETL pipeline       (Phase 2)
│   │   ├── extract.py       #   read CSVs
│   │   ├── transform.py     #   clean / dedupe / drop missing
│   │   ├── load.py          #   upsert + rebuild aggregates
│   │   └── run.py           #   orchestrator + CLI entrypoint
│   ├── schema.sql           # Reference DDL (app auto-creates tables too)
│   ├── requirements.txt
│   └── .env.example
│
├── data/                    # CSV inputs for the ETL  (Phase 2)
│   ├── books.csv            # 66 rows
│   ├── borrowers.csv        # 40 rows
│   ├── transactions.csv     # 123 rows (incl. 3 deliberately dirty rows)
│   └── README.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── styles.css
│       ├── components/
│       │   ├── Modal.jsx
│       │   ├── StatusBadge.jsx
│       │   └── BarChart.jsx       # Dependency-free chart (Phase 2)
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Books.jsx
│       │   ├── Borrowers.jsx
│       │   ├── BorrowReturn.jsx
│       │   ├── Search.jsx
│       │   └── Analytics.jsx      # Phase 2 reports + ETL trigger
│       └── services/
│           ├── books.js
│           ├── borrowers.js
│           ├── transactions.js
│           └── analytics.js
│
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Python** 3.10 or newer
- **Node.js** 18 or newer (and npm)
- **PostgreSQL** 13 or newer running locally (or reachable over the network)

---

## 1. Set up PostgreSQL

Create a database for the app. With `psql`:

```bash
psql -U postgres -c "CREATE DATABASE library_db;"
```

You can let the app create the tables on first startup (it calls `Base.metadata.create_all`), or run `backend/schema.sql` by hand:

```bash
psql -U postgres -d library_db -f backend/schema.sql
```

---

## 2. Run the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# macOS / Linux:
source .venv/bin/activate
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start the API
uvicorn main:app --reload --port 8000
```

The API is now running at <http://localhost:8000>.

- **Interactive docs:** <http://localhost:8000/docs>
- **ReDoc:** <http://localhost:8000/redoc>

### Backend environment variables (`backend/.env`)

| Variable        | Default                                                                 | Description                            |
|-----------------|-------------------------------------------------------------------------|----------------------------------------|
| `DATABASE_URL`  | `postgresql+psycopg2://postgres:postgres@localhost:5432/library_db`     | SQLAlchemy URL for PostgreSQL          |
| `CORS_ORIGINS`  | `http://localhost:5173,http://localhost:3000`                           | Comma-separated allowed origins        |
| `LOAN_DAYS`     | `14`                                                                    | Days before an open borrow is overdue  |

---

## 3. Run the Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app is now at <http://localhost:5173>.

---

## 4. Populate Data with the ETL (Phase 2)

The repository ships with a 229-row sample dataset in `data/`. With the backend running and the database empty, kick off the ETL once:

```bash
# Option A — from the CLI
cd backend
python -m etl.run

# Option B — from the API
curl -X POST http://localhost:8000/etl/run

# Option C — from the UI
# Open http://localhost:5173/analytics and click "Run ETL pipeline"
```

The ETL is idempotent — re-running it is always safe.

---

## API Reference

### Books

| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| GET    | `/books`           | List all books             |
| GET    | `/books/{id}`      | Get a book by ID           |
| POST   | `/books`           | Create a book              |
| PUT    | `/books/{id}`      | Update a book              |
| DELETE | `/books/{id}`      | Delete a book              |

### Borrowers

| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| GET    | `/borrowers`          | List all borrowers    |
| GET    | `/borrowers/{id}`     | Get a borrower by ID  |
| POST   | `/borrowers`          | Create a borrower     |
| PUT    | `/borrowers/{id}`     | Update a borrower     |
| DELETE | `/borrowers/{id}`     | Delete a borrower     |

### Transactions

| Method | Endpoint          | Description                                |
|--------|-------------------|--------------------------------------------|
| POST   | `/borrow`         | Borrow a book `{ book_id, borrower_id }`   |
| POST   | `/return`         | Return a book `{ transaction_id }`         |
| GET    | `/transactions`   | List all transactions (newest first)       |
| GET    | `/dashboard`      | Stats: total/available/borrowed counts     |

### Search

| Method | Endpoint                                          | Description                                  |
|--------|---------------------------------------------------|----------------------------------------------|
| GET    | `/search?q=...&title=...&author=...&category=...` | Search books (any subset of params allowed)  |

### Analytics (Phase 2)

| Method | Endpoint                                  | Description                                                 |
|--------|-------------------------------------------|-------------------------------------------------------------|
| GET    | `/analytics/popular-books?limit=N`        | Top-N most borrowed books (default 10)                      |
| GET    | `/analytics/category-borrowing`           | Borrow count per category                                   |
| GET    | `/analytics/monthly-trends?months=N`      | Borrow count per `YYYY-MM` for the last N months            |
| GET    | `/analytics/overdue?limit=N`              | Overdue summary + the currently overdue transactions list   |

### ETL (Phase 2)

| Method | Endpoint     | Description                                                          |
|--------|--------------|----------------------------------------------------------------------|
| POST   | `/etl/run`   | Ingest CSVs in `./data`, upsert rows, and rebuild analytics tables   |

---

## Database Schema

Core tables (Phase 1):

```
books
  book_id              SERIAL PRIMARY KEY
  title                VARCHAR(255)
  author               VARCHAR(255)
  category             VARCHAR(100)
  isbn                 VARCHAR(32)  UNIQUE
  availability_status  VARCHAR(20)   -- 'available' | 'borrowed'
  created_at           TIMESTAMPTZ

borrowers
  borrower_id    SERIAL PRIMARY KEY
  borrower_name  VARCHAR(255)
  email          VARCHAR(255) UNIQUE
  phone          VARCHAR(32)
  created_at     TIMESTAMPTZ

transactions
  transaction_id  SERIAL PRIMARY KEY
  book_id         INTEGER  FK -> books(book_id)
  borrower_id     INTEGER  FK -> borrowers(borrower_id)
  borrow_date     TIMESTAMPTZ
  return_date     TIMESTAMPTZ  (NULL = still borrowed)
```

Analytics aggregates (Phase 2 — populated by the ETL):

```
agg_popular_books         (book_id, title, author, category, borrow_count)
agg_category_borrowing    (category, borrow_count)
agg_monthly_trends        (month YYYY-MM, borrow_count)
agg_overdue_summary       (loan_days, open_overdue, returned_late, open_total, computed_at)
```

---

## Pages (Frontend)

- **Dashboard** — totals (books, available, borrowed, borrowers, open transactions) and recent transactions.
- **Books** — full CRUD with modal-based forms.
- **Borrowers** — full CRUD with email + phone validation.
- **Borrow / Return** — borrow an available book to any borrower; return open transactions in one click.
- **Search** — by keyword (across title/author/category/ISBN) or by individual filters.
- **Analytics (Phase 2)** — popular books, borrowing by category, monthly trends, and a list of currently overdue transactions. Includes a one-click **Run ETL pipeline** button.

---

## ETL Pipeline (Phase 2)

The ETL is a classic Extract → Transform → Load → Aggregate pipeline that ingests three CSVs and rebuilds the analytics tables.

### Stage breakdown

1. **Extract** (`etl/extract.py`) — reads `data/books.csv`, `data/borrowers.csv`, `data/transactions.csv`.
2. **Transform** (`etl/transform.py`) — strips whitespace, lowercases emails, drops rows with missing required fields, deduplicates by natural key, parses borrow/return dates. Returns counters in the run report.
3. **Load** (`etl/load.py`) — upserts books / borrowers / transactions, then reconciles each book's `availability_status` from the live state of its transactions.
4. **Aggregate** (`etl/load.py`) — rebuilds `agg_popular_books`, `agg_category_borrowing`, `agg_monthly_trends`, and `agg_overdue_summary` from scratch.

### Sample dataset

A ready-to-run dataset lives under `data/` (66 books + 40 borrowers + 123 transactions = **229 records**, exceeding the spec's 150-record minimum). A few rows in `transactions.csv` are intentionally malformed so you can see the Transform stage's deduplication and validation in action — see `data/README.md`.

### Bringing your own data

Drop CSVs at the same paths with the same column names and re-run `python -m etl.run`. Column expectations:

- `books.csv`: `title, author, category, isbn`
- `borrowers.csv`: `borrower_name, email, phone`
- `transactions.csv`: `book_isbn, borrower_email, borrow_date, return_date`

Transactions reference books by **ISBN** and borrowers by **email** — surrogate IDs are resolved during Load, so the CSVs stay portable across databases.

---

## What's Still NOT Included

Per the original Phase 1 scope (and not addressed in Phase 2):

- Authentication / authorization
- Notifications and reminders
- Fine calculation (overdue is detected and reported, but no monetary fines are computed)
- AI/ML, recommendations, or semantic search
- Cloud deployment

The data model already records `borrow_date` and `return_date`, and the overdue summary surfaces exactly the inputs a fine-calculation feature would need.

---

## Troubleshooting

- **`psycopg2` install fails:** make sure you have Postgres client libs available, or `pip install psycopg2-binary` (already pinned in `requirements.txt`).
- **CORS error in the browser:** confirm `CORS_ORIGINS` in `backend/.env` includes the frontend origin (default `http://localhost:5173`).
- **`relation "books" does not exist`:** the app auto-creates tables on startup. If you connected to a different database than expected, double-check `DATABASE_URL`.
- **Analytics page is empty:** click **Run ETL pipeline**, or run `python -m etl.run` from the backend folder. The aggregates start empty until the ETL has run once.
