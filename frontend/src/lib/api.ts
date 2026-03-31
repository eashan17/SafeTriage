const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── Patient Vitals (matches backend PatientVitals model) ───────────

export type ArrivalMode = "walk_in" | "wheelchair" | "ambulance";

export interface PatientVitals {
  age: number;
  heart_rate: number;
  systolic_blood_pressure: number;
  oxygen_saturation: number;
  body_temperature: number;
  pain_level: number;
  chronic_disease_count: number;
  previous_er_visits: number;
  arrival_mode: ArrivalMode;
}

// ── Request / Response types ───────────────────────────────────────

export interface PredictRequest {
  patient_id: string;
  vitals: PatientVitals;
}

export interface PredictResponse {
  patient_id: string;
  prediction: string;
  confidence: number | null;
  reasoning: string;
  flags: string[];
}

export interface AuditRequest {
  patient_id: string;
  patient_vitals: PatientVitals;
  ai_prediction: string;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  human_decision: string;
  human_override_reason?: string | null;
  final_triage_level: string;
}

export interface AuditRecord {
  id: number;
  timestamp: string;
  patient_vitals: Record<string, unknown>;
  ai_prediction: string;
  ai_confidence: string | null;
  ai_reasoning: string | null;
  human_decision: string;
  human_override_reason?: string | null;
  final_triage_level: string;
}

// ── API calls ──────────────────────────────────────────────────────

export async function predict(data: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Predict failed: ${res.status}`);
  return res.json();
}

export async function submitAudit(data: AuditRequest): Promise<{ status: string; record_id: number }> {
  const res = await fetch(`${API_BASE}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Audit failed: ${res.status}`);
  return res.json();
}

export async function fetchAuditLogs(limit = 50): Promise<AuditRecord[]> {
  const res = await fetch(`${API_BASE}/audit?limit=${limit}`);
  if (!res.ok) throw new Error(`Fetch audit logs failed: ${res.status}`);
  return res.json();
}
