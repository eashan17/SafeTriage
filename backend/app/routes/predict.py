"""POST /predict — proxy vitals to Impulse AI and return prediction + medical reasoning."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import PatientVitals, PredictRequest, PredictResponse

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════════
#  MEDICAL REASONING HEURISTIC
#  Rule-based explainability layer — gives human operators clinical context
#  for WHY the AI made a particular triage decision.
# ═══════════════════════════════════════════════════════════════════════════

def _build_medical_reasoning(vitals: PatientVitals, prediction: str) -> tuple[str, list[str]]:
    """Analyse patient vitals against clinical thresholds and produce
    a human-readable reasoning string plus a list of clinical flags.

    Returns:
        (reasoning_text, flags_list)
    """
    flags: list[str] = []
    explanations: list[str] = []

    # ── Heart rate ──────────────────────────────────────────────
    if vitals.heart_rate > 120:
        flags.append("CRITICAL: Tachycardia")
        explanations.append(
            f"Heart rate is critically elevated at {vitals.heart_rate} bpm "
            "(normal: 60–100 bpm). Severe tachycardia may indicate shock, "
            "sepsis, or cardiac emergency."
        )
    elif vitals.heart_rate > 100:
        flags.append("WARNING: Elevated heart rate")
        explanations.append(
            f"Heart rate of {vitals.heart_rate} bpm is above normal range "
            "(60–100 bpm). Could indicate pain response, anxiety, or early "
            "hemodynamic instability."
        )
    elif vitals.heart_rate < 50:
        flags.append("CRITICAL: Bradycardia")
        explanations.append(
            f"Heart rate is dangerously low at {vitals.heart_rate} bpm. "
            "May indicate cardiac conduction abnormality or medication effect."
        )
    else:
        explanations.append(
            f"Heart rate of {vitals.heart_rate} bpm is within normal range (60–100 bpm)."
        )

    # ── Blood pressure ─────────────────────────────────────────
    if vitals.systolic_blood_pressure > 180:
        flags.append("CRITICAL: Hypertensive crisis")
        explanations.append(
            f"Systolic BP of {vitals.systolic_blood_pressure} mmHg exceeds "
            "crisis threshold (>180 mmHg). Risk of stroke, organ damage."
        )
    elif vitals.systolic_blood_pressure < 90:
        flags.append("CRITICAL: Hypotension")
        explanations.append(
            f"Systolic BP of {vitals.systolic_blood_pressure} mmHg is below "
            "90 mmHg — possible shock or circulatory failure."
        )
    else:
        explanations.append(
            f"Systolic BP of {vitals.systolic_blood_pressure} mmHg is within normal range (90–180 mmHg)."
        )

    # ── Oxygen saturation ──────────────────────────────────────
    if vitals.oxygen_saturation < 90:
        flags.append("CRITICAL: Severe hypoxemia")
        explanations.append(
            f"SpO₂ at {vitals.oxygen_saturation}% is critically low "
            "(normal: ≥95%). Immediate oxygen support may be required."
        )
    elif vitals.oxygen_saturation < 95:
        flags.append("WARNING: Low oxygen saturation")
        explanations.append(
            f"SpO₂ at {vitals.oxygen_saturation}% is below normal "
            "(≥95%). Monitor closely for respiratory decline."
        )
    else:
        explanations.append(
            f"SpO₂ at {vitals.oxygen_saturation}% is within normal range (≥95%)."
        )

    # ── Body temperature ───────────────────────────────────────
    if vitals.body_temperature >= 39.5:
        flags.append("CRITICAL: High fever")
        explanations.append(
            f"Temperature of {vitals.body_temperature}°C indicates high fever. "
            "May suggest severe infection or sepsis."
        )
    elif vitals.body_temperature >= 38.0:
        flags.append("WARNING: Fever")
        explanations.append(
            f"Temperature of {vitals.body_temperature}°C indicates fever "
            "(normal: 36.1–37.2°C). Possible infection."
        )
    elif vitals.body_temperature < 35.0:
        flags.append("CRITICAL: Hypothermia")
        explanations.append(
            f"Temperature of {vitals.body_temperature}°C indicates hypothermia. "
            "Risk of cardiac arrhythmia."
        )
    else:
        explanations.append(
            f"Body temperature of {vitals.body_temperature}°C is within normal range (36.1–37.2°C)."
        )

    # ── Pain level ─────────────────────────────────────────────
    if vitals.pain_level >= 8:
        flags.append("WARNING: Severe pain")
        explanations.append(
            f"Patient reports pain level {vitals.pain_level}/10. "
            "Severe pain warrants urgent assessment and analgesia."
        )
    elif vitals.pain_level >= 5:
        explanations.append(
            f"Patient reports moderate pain ({vitals.pain_level}/10). Monitor for escalation."
        )
    else:
        explanations.append(
            f"Patient reports mild pain ({vitals.pain_level}/10). No analgesic urgency."
        )

    # ── Age risk factor ────────────────────────────────────────
    if vitals.age >= 70:
        flags.append("NOTE: Geriatric patient")
        explanations.append(
            f"Patient age ({vitals.age}y) places them in a higher-risk "
            "demographic. Elderly patients may deteriorate rapidly."
        )
    elif vitals.age <= 5:
        flags.append("NOTE: Pediatric patient")
        explanations.append(
            f"Patient age ({vitals.age}y) — pediatric vitals thresholds apply."
        )
    else:
        explanations.append(
            f"Patient age ({vitals.age}y) — standard adult demographic."
        )

    # ── Chronic disease burden ─────────────────────────────────
    if vitals.chronic_disease_count >= 3:
        flags.append("NOTE: High comorbidity burden")
        explanations.append(
            f"Patient has {vitals.chronic_disease_count} chronic conditions. "
            "Multiple comorbidities increase risk of complications."
        )
    elif vitals.chronic_disease_count > 0:
        explanations.append(
            f"Patient has {vitals.chronic_disease_count} chronic condition(s). Noted for context."
        )
    else:
        explanations.append("No chronic conditions reported.")

    # ── Arrival mode ───────────────────────────────────────────
    if vitals.arrival_mode.value == "ambulance":
        flags.append("NOTE: Arrived by ambulance")
        explanations.append(
            "Patient arrived by ambulance, suggesting pre-hospital "
            "assessment deemed transport urgency necessary."
        )
    elif vitals.arrival_mode.value == "wheelchair":
        explanations.append("Patient arrived by wheelchair — limited mobility noted.")
    else:
        explanations.append("Patient arrived as walk-in.")

    # ── Previous ER visits ─────────────────────────────────────
    if vitals.previous_er_visits >= 5:
        explanations.append(
            f"Patient has {vitals.previous_er_visits} previous ER visits — "
            "consider chronic condition management."
        )
    elif vitals.previous_er_visits > 0:
        explanations.append(
            f"Patient has {vitals.previous_er_visits} previous ER visit(s)."
        )
    else:
        explanations.append("No previous ER visits on record.")

    # ── Build final reasoning ──────────────────────────────────
    critical_count = sum(1 for f in flags if f.startswith("CRITICAL"))
    warning_count = sum(1 for f in flags if f.startswith("WARNING"))

    summary_parts = [f"AI triage assessment: **{prediction}**."]
    if critical_count:
        summary_parts.append(
            f"⚠ {critical_count} critical flag(s) detected requiring immediate attention."
        )
    if warning_count:
        summary_parts.append(f"{warning_count} warning flag(s) noted.")
    if not flags:
        summary_parts.append("No critical clinical flags detected. Vitals are within acceptable ranges.")

    reasoning = " ".join(summary_parts) + "\n\n" + "\n".join(f"• {e}" for e in explanations)

    return reasoning.strip(), flags


# ═══════════════════════════════════════════════════════════════════════════
#  ROUTE
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    """Forward patient vitals to Impulse AI and augment with medical reasoning."""

    vitals = payload.vitals

    # ── 4-class triage labels (matching Kaggle dataset) ────────
    # 0 = Low (Non-urgent), 1 = Medium, 2 = High, 3 = Critical
    TRIAGE_LABELS = {
        0: "Low — Non-urgent",
        1: "Medium — Requires attention",
        2: "High — Rapid intervention required",
        3: "Critical — Immediate care needed",
    }

    if not settings.IMPULSE_AI_URL or not settings.IMPULSE_AI_KEY:
        # ── Fallback: demo mode ─────────────────────────────────
        reasoning, flags = _build_medical_reasoning(vitals, TRIAGE_LABELS[1])
        return PredictResponse(
            patient_id=payload.patient_id,
            prediction=TRIAGE_LABELS[1],
            confidence=0.82,
            reasoning="DEMO MODE — Impulse AI credentials not configured.\n\n" + reasoning,
            flags=flags,
        )

    # ── Build Impulse AI payload ────────────────────────────────
    impulse_payload = {
        "deployment_id": settings.IMPULSE_AI_DEPLOYMENT_ID,
        "inputs": {
            "age": vitals.age,
            "heart_rate": vitals.heart_rate,
            "systolic_blood_pressure": vitals.systolic_blood_pressure,
            "oxygen_saturation": vitals.oxygen_saturation,
            "body_temperature": vitals.body_temperature,
            "pain_level": vitals.pain_level,
            "chronic_disease_count": vitals.chronic_disease_count,
            "previous_er_visits": vitals.previous_er_visits,
            "arrival_mode": vitals.arrival_mode.value,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                settings.IMPULSE_AI_URL,
                json=impulse_payload,
                headers={
                    "Authorization": f"Bearer {settings.IMPULSE_AI_KEY}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            raw = resp.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Impulse AI returned {exc.response.status_code}: {exc.response.text}",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not reach Impulse AI: {exc}",
        ) from exc

    # ── Parse prediction from Impulse AI response ──────────────
    # Response format: {"prediction": 0|1, "probability": float, "target": "triage_level"}
    raw_prediction = raw.get("prediction", 0)
    probability = raw.get("probability")

    # Normalise confidence to 0-1 range
    # probability = P(class 1 / urgent).  To express confidence in whichever
    # class the model actually picked, use max(prob, 1 − prob).
    confidence = None
    if probability is not None:
        prob = float(probability)
        # If probability > 1 treat it as a raw score — sigmoid-normalize
        if prob > 1.0:
            import math
            confidence = 1.0 / (1.0 + math.exp(-prob))
        else:
            prob = max(0.0, min(1.0, prob))
            confidence = max(prob, 1.0 - prob)

    # Map binary prediction → 4-class triage using vitals-based heuristic
    # 0 = model says non-urgent, 1 = model says urgent
    is_urgent = int(raw_prediction) == 1

    # Pre-compute flags to refine the level assignment
    reasoning, flags = _build_medical_reasoning(vitals, "")
    critical_count = sum(1 for f in flags if f.startswith("CRITICAL"))
    warning_count = sum(1 for f in flags if f.startswith("WARNING"))

    if is_urgent:
        if critical_count >= 2:
            triage_label = TRIAGE_LABELS[3]   # Critical
        elif critical_count >= 1:
            triage_label = TRIAGE_LABELS[2]   # High
        else:
            triage_label = TRIAGE_LABELS[1]   # Medium
    else:
        if critical_count >= 1:
            # Model says non-urgent but vitals are critical → escalate
            triage_label = TRIAGE_LABELS[2]   # High
        elif warning_count >= 2:
            triage_label = TRIAGE_LABELS[1]   # Medium
        else:
            triage_label = TRIAGE_LABELS[0]   # Low

    # Rebuild reasoning with the final triage label
    reasoning, flags = _build_medical_reasoning(vitals, triage_label)

    return PredictResponse(
        patient_id=payload.patient_id,
        prediction=triage_label,
        confidence=confidence,
        reasoning=reasoning,
        flags=flags,
    )
