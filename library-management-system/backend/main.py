"""FastAPI application entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
from routers import analytics, books, borrowers, etl, search, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup. For production prefer Alembic migrations.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "REST API for the Library Management System. "
        "Phase 1: CRUD over books and borrowers, borrow/return workflows, search. "
        "Phase 2: ETL pipeline for CSV ingestion and analytics endpoints "
        "(popular books, category trends, monthly trends, overdue analysis)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(books.router)
app.include_router(borrowers.router)
app.include_router(transactions.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(etl.router)


@app.get("/", tags=["meta"])
def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
