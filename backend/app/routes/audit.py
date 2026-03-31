"""POST /audit — persist triage decision; GET /audit — list recent records."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TriageLog
from app.schemas import AuditRecord, AuditRequest, AuditResponse

router = APIRouter()


@router.post("/audit", response_model=AuditResponse)
def create_audit(payload: AuditRequest, db: Session = Depends(get_db)):
    """Write an immutable triage-decision record to the audit trail."""
    record = TriageLog(
        patient_vitals=payload.patient_vitals,
        ai_prediction=payload.ai_prediction,
        ai_confidence=str(payload.ai_confidence) if payload.ai_confidence is not None else None,
        ai_reasoning=payload.ai_reasoning,
        human_decision=payload.human_decision,
        human_override_reason=payload.human_override_reason,
        final_triage_level=payload.final_triage_level,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return AuditResponse(record_id=record.id)


@router.get("/audit", response_model=List[AuditRecord])
def list_audits(limit: int = 50, db: Session = Depends(get_db)):
    """Return the most recent triage audit records, newest first."""
    return (
        db.query(TriageLog)
        .order_by(TriageLog.timestamp.desc())
        .limit(limit)
        .all()
    )
