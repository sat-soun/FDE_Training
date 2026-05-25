from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import feedback, etl

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Feedback Management System",
    description="A centralized platform for collecting and managing feedback from participants, employees, and customers.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(feedback.router)
app.include_router(etl.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Feedback Management System API is running"}
