from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import CORS_ORIGINS, GROQ_API_KEY
from .database import SessionLocal, engine, get_db
from .models import Base
from .seed import seed
from .ml.ml_adapter import get_model, model_ready, rebuild_model
from .api import goals, profiles, recommendations, paths, progress, feedback, mentor, dashboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("padhai")


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


app = FastAPI(title="PadhAI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_slow_and_errors(request: Request, call_next):
    t0 = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled error %s %s", request.method, request.url.path)
        raise
    dur_ms = (time.perf_counter() - t0) * 1000
    if response.status_code >= 500:
        logger.error("%s %s -> %d (%.0fms)", request.method, request.url.path,
                     response.status_code, dur_ms)
    elif dur_ms > 2000:
        logger.warning("slow %s %s -> %d (%.0fms)", request.method, request.url.path,
                       response.status_code, dur_ms)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return a clean JSON 500 (no stack trace leak) and log the full trace."""
    logger.exception("unhandled error %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})

app.include_router(goals.router)
app.include_router(profiles.router)
app.include_router(recommendations.router)
app.include_router(paths.router)
app.include_router(progress.router)
app.include_router(feedback.router)
app.include_router(mentor.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health(db=Depends(get_db)):
    database = "ok"
    resource_count = 0
    try:
        from .models import Resource
        resource_count = db.query(Resource).count()
    except Exception:
        database = "error"
    return {
        "status": "ok" if database == "ok" else "degraded",
        "version": "1.0.0",
        "groq_configured": bool(GROQ_API_KEY),
        "database": database,
        "resources": resource_count,
        "model_ready": model_ready(),
    }


@app.get("/")
def root():
    return {"name": "PadhAI API", "docs": "/docs"}
