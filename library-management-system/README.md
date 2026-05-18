# Library Management System — Phase 1

A full-stack web application for managing books, borrowers, and borrow/return transactions in a library. Built with **React** (frontend), **FastAPI** (backend), and **PostgreSQL** (database).

This implements every requirement in the Phase 1 specification: book CRUD, borrower CRUD, borrow/return workflows, search, REST API design, CORS, Pydantic validation, exception handling, and a responsive React UI built with functional components and hooks.

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
│   ├── config.py            # Settings loaded from .env
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models (Book, Borrower, Transaction)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud.py              # Database access functions
│   ├── routers/
│   │   ├── books.py
│   │   ├── borrowers.py
│   │   ├── transactions.py  # /borrow, /return, /transactions, /dashboard
│   │   └── search.py
│   ├── services/            # (reserved for future business logic)
│   ├── schema.sql           # Reference DDL (app auto-creates tables too)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js              # Axios instance + error normalization
│       ├── styles.css
│       ├── components/
│       │   ├── Modal.jsx
│       │   └── StatusBadge.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Books.jsx
│       │   ├── Borrowers.jsx
│       │   ├── BorrowReturn.jsx
│       │   └── Search.jsx
│       └── services/
│           ├── books.js
│           ├── borrowers.js
│           └── transactions.js
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

(Or use pgAdmin / DBeaver — any tool that can create a Postgres database.)

You can let the app create the tables on first startup (it calls `Base.metadata.create_all`). If you'd rather run the DDL manually, the schema is at `backend/schema.sql`:

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
# Edit .env and update DATABASE_URL if your Postgres credentials differ.

# Start the API
uvicorn main:app --reload --port 8000
```

The API is now running at <http://localhost:8000>.

- **Interactive docs (Swagger):** <http://localhost:8000/docs>
- **ReDoc:** <http://localhost:8000/redoc>
- **Health check:** <http://localhost:8000/health>

### Backend environment variables (`backend/.env`)

| Variable        | Default                                                                 | Description                            |
|-----------------|-------------------------------------------------------------------------|----------------------------------------|
| `DATABASE_URL`  | `postgresql+psycopg2://postgres:postgres@localhost:5432/library_db`     | SQLAlchemy URL for PostgreSQL          |
| `CORS_ORIGINS`  | `http://localhost:5173,http://localhost:3000`                           | Comma-separated allowed origins        |

---

## 3. Run the Frontend

In a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — defaults to http://localhost:8000)
cp .env.example .env

# Start the dev server
npm run dev
```

The app is now at <http://localhost:5173>.

### Frontend environment variables (`frontend/.env`)

| Variable             | Default                  | Description                       |
|----------------------|--------------------------|-----------------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:8000`  | Base URL of the FastAPI backend   |

---

## API Reference

All endpoints return JSON. Validation errors come back as HTTP 422; business-rule errors (e.g., trying to borrow an unavailable book) come back as HTTP 400 with a human-readable `detail`.

### Books

| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| GET    | `/books`           | List all books             |
| GET    | `/books/{id}`      | Get a book by ID           |
| POST   | `/books`           | Create a book              |
| PUT    | `/books/{id}`      | Update a book              |
| DELETE | `/books/{id}`      | Delete a book              |

Example create:

```bash
curl -X POST http://localhost:8000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Clean Code","author":"Robert C. Martin","category":"Programming","isbn":"9780132350884"}'
```

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

---

## Database Schema

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

---

## Pages (Frontend)

- **Dashboard** — totals (books, available, borrowed, borrowers, open transactions) and recent transactions.
- **Books** — full CRUD with modal-based forms.
- **Borrowers** — full CRUD with email + phone validation.
- **Borrow / Return** — borrow an available book to any borrower; return open transactions in one click.
- **Search** — by keyword (across title/author/category/ISBN) or by individual filters.

All UI is built with functional components + hooks (`useState`, `useEffect`, `useMemo`), with client-side validation and graceful error handling for API failures.

---

## What's Intentionally NOT in Phase 1

Per the requirements, the following are out of scope and not included:

- Authentication / authorization
- Notifications and reminders
- Fine / overdue calculation
- AI/ML, recommendations, or semantic search
- Cloud deployment

The codebase is structured so each of these can be added cleanly later (e.g., `services/` is reserved for business logic, routers are modular, and the data model already records `borrow_date` and `return_date` to support fine logic).

---

## Quick Smoke Test

After both servers are running:

1. Open <http://localhost:5173>.
2. Go to **Borrowers**, add a borrower.
3. Go to **Books**, add a book (any ISBN string).
4. Go to **Borrow / Return**, borrow the new book for the new borrower.
5. Return to the **Dashboard** — the counts should reflect the borrow.
6. Click **Return** on the open transaction. The book becomes available again.

---

## Troubleshooting

- **`psycopg2` install fails:** make sure you have Postgres client libs available, or `pip install psycopg2-binary` (already pinned in `requirements.txt`).
- **CORS error in the browser:** confirm `CORS_ORIGINS` in `backend/.env` includes the frontend origin (default `http://localhost:5173`).
- **Frontend can't reach the API:** check `VITE_API_BASE_URL` in `frontend/.env` and that the backend is running on that port.
- **`relation "books" does not exist`:** the app auto-creates tables on startup. If you connected to a different database than expected, double-check `DATABASE_URL`.
