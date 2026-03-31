"""SQLAlchemy ORM models — Audit Trail."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TriageLog(Base):
    """Immutable audit record for every triage decision."""

    __tablename__ = "triage_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    patient_vitals: Mapped[dict] = mapped_column(JSON, nullable=False)
    ai_prediction: Mapped[str] = mapped_column(String, nullable=False)
    ai_confidence: Mapped[str] = mapped_column(String, nullable=True)
    ai_reasoning: Mapped[str] = mapped_column(String, nullable=True)
    human_decision: Mapped[str] = mapped_column(String, nullable=False)
    human_override_reason: Mapped[str] = mapped_column(String, nullable=True)
    final_triage_level: Mapped[str] = mapped_column(String, nullable=False)
