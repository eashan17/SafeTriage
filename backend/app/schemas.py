"""Pydantic request / response schemas — typed patient vitals."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Patient Vitals (final Kaggle schema) ────────────────────────────────────

class ArrivalMode(str, Enum):
    walk_in = "walk_in"
    wheelchair = "wheelchair"
    ambulance = "ambulance"


class PatientVitals(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Patient age (years)")
    heart_rate: float = Field(..., ge=0, description="Heart rate at arrival (bpm)")
    systolic_blood_pressure: float = Field(..., ge=0, description="Systolic blood pressure (mmHg)")
    oxygen_saturation: float = Field(..., ge=0, le=100, description="Blood oxygen saturation (%)")
    body_temperature: float = Field(..., ge=25, le=45, description="Body temperature (°C)")
    pain_level: int = Field(..., ge=1, le=10, description="Self-reported pain score (1–10)")
    chronic_disease_count: int = Field(..., ge=0, description="Number of known chronic conditions")
    previous_er_visits: int = Field(..., ge=0, description="Number of previous ER visits")
    arrival_mode: ArrivalMode = Field(..., description="Mode of arrival")


# ── Predict ─────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    patient_id: str = Field(..., description="Auto-generated session UUID")
    vitals: PatientVitals


class PredictResponse(BaseModel):
    patient_id: str
    prediction: str = Field(..., description='e.g. "Level 2: Urgent"')
    confidence: Optional[float] = Field(None, ge=0, le=1)
    reasoning: str = Field(
        ..., description="Medical reasoning heuristic — human-readable rationale"
    )
    flags: List[str] = Field(
        default_factory=list,
        description="Clinical flags that triggered concern",
    )


# ── Audit ───────────────────────────────────────────────────────────────────

class AuditRequest(BaseModel):
    patient_id: str
    patient_vitals: Dict[str, Any]
    ai_prediction: str
    ai_confidence: Optional[float] = None
    ai_reasoning: Optional[str] = None
    human_decision: str = Field(
        ..., description='"Approved" or "Overridden"'
    )
    human_override_reason: Optional[str] = Field(
        None, description="Reason for the human overriding the AI decision"
    )
    final_triage_level: str


class AuditRecord(BaseModel):
    id: int
    timestamp: datetime
    patient_vitals: Dict[str, Any]
    ai_prediction: str
    ai_confidence: Optional[str] = None
    ai_reasoning: Optional[str] = None
    human_decision: str
    human_override_reason: Optional[str] = None
    final_triage_level: str

    model_config = {"from_attributes": True}


class AuditResponse(BaseModel):
    status: str = "ok"
    record_id: int
