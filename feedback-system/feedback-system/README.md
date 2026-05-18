# 💬 Feedback Management System — Phase 1

A full-stack web application for centralized feedback collection and management.

**Stack:** React (frontend) · FastAPI (backend) · SQLite (database)

---

## Project Structure

```
feedback-system/
├── backend/
│   ├── main.py          # FastAPI app, CORS, startup
│   ├── database.py      # SQLAlchemy engine + session
│   ├── models.py        # ORM model (Feedback table)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # DB operations (CRUD + search + stats)
│   ├── routers/
│   │   └── feedback.py  # All /feedback API routes
│   └── requirements.txt
│
└── frontend/
    ├── package.json
    └── src/
        ├── api.js                        # Axios API service
        ├── App.js                        # Router setup
        ├── index.js                      # React entry point
        ├── components/
        │   ├── Navbar.js                 # Navigation bar
        │   ├── FeedbackCard.js           # Card with edit/delete
        │   └── StarRating.js             # Star & badge components
        └── pages/
            ├── Dashboard.js              # Stats + recent entries
            ├── FeedbackList.js           # List + search + filter
            ├── FeedbackDetail.js         # Full feedback view
            └── FeedbackForm.js           # Create & edit form
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

---

## Setup & Run

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be running at: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm start
```

The app will open at: **http://localhost:3000**

---

## API Reference

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/`                   | Health check                       |
| GET    | `/feedback`           | List all feedback (paginated)      |
| GET    | `/feedback/stats`     | Aggregate stats & distribution     |
| GET    | `/feedback/search`    | Search & filter feedback           |
| GET    | `/feedback/{id}`      | Get feedback by ID                 |
| POST   | `/feedback`           | Submit new feedback                |
| PUT    | `/feedback/{id}`      | Update feedback                    |
| DELETE | `/feedback/{id}`      | Delete feedback                    |

### Query Parameters — `/feedback/search`

| Param        | Type    | Description                          |
|--------------|---------|--------------------------------------|
| `keyword`    | string  | Search in name, program, comments    |
| `rating`     | int     | Filter by exact rating (1–5)         |
| `program_name` | string | Filter by program/event name       |
| `skip`       | int     | Pagination offset (default: 0)       |
| `limit`      | int     | Max results (default: 100)           |

### POST `/feedback` — Request Body

```json
{
  "participant_name": "Priya Sharma",
  "program_name": "Data Engineering Bootcamp",
  "rating": 5,
  "comments": "Excellent content and well-structured curriculum!"
}
```

---

## Database Schema

**Table: `feedback`**

| Column           | Type     | Notes                   |
|------------------|----------|-------------------------|
| feedback_id      | INTEGER  | PK, auto-increment      |
| participant_name | VARCHAR  | Required                |
| program_name     | VARCHAR  | Required                |
| rating           | INTEGER  | 1–5                     |
| comments         | TEXT     | Optional                |
| submitted_at     | DATETIME | Auto-set on insert      |

SQLite database file: `backend/feedback.db` (auto-created on first run)

---

## Features

- ✅ Submit feedback with name, program, star rating, and comments
- ✅ View all feedback in a searchable, filterable list
- ✅ Full-text search across name, program, and comments
- ✅ Filter by rating (1–5) and program name
- ✅ View detailed individual feedback entries
- ✅ Edit existing feedback entries
- ✅ Delete feedback entries
- ✅ Dashboard with total count, average rating, and rating distribution chart
- ✅ Responsive UI with hover states and form validation
- ✅ REST API with Pydantic validation and proper HTTP status codes
- ✅ Interactive Swagger docs at `/docs`

---

## Future Phases

- Phase 2: Authentication & authorization
- Phase 3: Sentiment analysis & AI summarization
- Phase 4: Data Engineering pipelines & analytics dashboard
- Phase 5: Semantic search with embeddings
- Phase 6: Cloud deployment
