from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, GROQ_API_KEY
from .database import SessionLocal, engine
from .models import Base
from .seed import seed
from .ml.ml_adapter import rebuild_model
from .api import goals, profiles, recommendations, paths, progress, feedback, mentor, dashboard


def _startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    # build ML model from seeded resources
    from .models import Resource
    d2 = SessionLocal()
    try:
        rebuild_model(d2.query(Resource).all())
    finally:
        d2.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _startup()
    yield


app = FastAPI(title="Pathwise API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(goals.router)
app.include_router(profiles.router)
app.include_router(recommendations.router)
app.include_router(paths.router)
app.include_router(progress.router)
app.include_router(feedback.router)
app.include_router(mentor.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "groq_configured": bool(GROQ_API_KEY),
    }


@app.get("/")
def root():
    return {"name": "Pathwise API", "docs": "/docs"}
