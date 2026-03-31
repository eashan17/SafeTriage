"""SafeTriage AI — FastAPI entry point."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes import audit, predict


# ── Lifespan: create DB tables on startup ───────────────────────────────────
@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SafeTriage AI",
    version="0.1.0",
    description="Human-in-the-loop AI triage system with full audit trail.",
    lifespan=lifespan,
)

# ── CORS — configurable via ALLOWED_ORIGINS env var ─────────────────────────
_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ───────────────────────────────────────────────────────────
app.include_router(predict.router, tags=["Prediction"])
app.include_router(audit.router, tags=["Audit Trail"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "safetriage-ai"}
