import { useCallback, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { PatientForm } from "@/components/PatientForm";
import { InterpretabilityDashboard } from "@/components/InterpretabilityDashboard";
import { AuditLog } from "@/components/AuditLog";
import { Separator } from "@/components/ui/separator";
import {
  predict,
  submitAudit,
  type PredictRequest,
  type PredictResponse,
} from "@/lib/api";

type Phase = "intake" | "review" | "decided";

export default function App() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const lastRequest = useRef<PredictRequest | null>(null);

  /* ── Step 1 → 2 : submit vitals to /predict ───────────────── */
  const handleSubmit = useCallback(async (data: PredictRequest) => {
    lastRequest.current = data;
    setLoading(true);
    try {
      const res = await predict(data);
      setResult(res);
      setPhase("review");
    } catch (err) {
      console.error("Predict failed:", err);
      alert("Failed to reach the prediction service. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Step 2 → 3 : human approves ──────────────────────────── */
  const handleApprove = useCallback(async () => {
    if (!result || !lastRequest.current) return;
    await submitAudit({
      patient_id: result.patient_id,
      patient_vitals: lastRequest.current.vitals,
      ai_prediction: result.prediction,
      ai_confidence: result.confidence,
      ai_reasoning: result.reasoning,
      human_decision: "Approved",
      final_triage_level: result.prediction,
    });
    setPhase("decided");
  }, [result]);

  /* ── Step 2 → 3 : human overrides with a different level ─── */
  const handleOverride = useCallback(
    async (level: string, reason: string) => {
      if (!result || !lastRequest.current) return;
      await submitAudit({
        patient_id: result.patient_id,
        patient_vitals: lastRequest.current.vitals,
        ai_prediction: result.prediction,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
        human_decision: "Overridden",
        human_override_reason: reason,
        final_triage_level: level,
      });
      setPhase("decided");
    },
    [result]
  );

  /* ── Reset for next patient ────────────────────────────────── */
  function handleNewPatient() {
    setPhase("intake");
    setResult(null);
    lastRequest.current = null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Two-column layout: form | dashboard */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <PatientForm
            onSubmit={handleSubmit}
            isLoading={loading}
            isLocked={phase !== "intake"}
          />
          <InterpretabilityDashboard
            result={result}
            onApprove={handleApprove}
            onOverride={handleOverride}
            decided={phase === "decided"}
          />
        </div>

        {/* New patient button after decision */}
        {phase === "decided" && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleNewPatient}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90"
            >
              ▸ Start New Patient Session
            </button>
          </div>
        )}

        <Separator className="my-8" />

        {/* Audit trail */}
        <AuditLog />
      </main>
    </div>
  );
}
