import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Brain, ShieldAlert, Gauge } from "lucide-react";
import type { PredictResponse } from "@/lib/api";

interface InterpretabilityDashboardProps {
  result: PredictResponse | null;
  onApprove: () => void;
  onOverride: (level: string, reason: string) => void;
  decided: boolean; // true after human clicks Approve or Override
}

const TRIAGE_LEVELS = [
  "Critical — Immediate care needed",
  "High — Rapid intervention required",
  "Medium — Requires attention",
  "Low — Non-urgent",
];

export function InterpretabilityDashboard({
  result,
  onApprove,
  onOverride,
  decided,
}: InterpretabilityDashboardProps) {
  const [selectedOverride, setSelectedOverride] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Submit patient vitals to receive an AI triage prediction.
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidencePct = result.confidence != null ? Math.round(result.confidence * 100) : null;

  return (
    <Card className={decided ? "border-success/40 bg-success/[0.02]" : "border-primary/40 ring-2 ring-primary/10"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
            2
          </span>
          Interpretability Dashboard
          {decided && (
            <Badge variant="success" className="ml-auto text-[10px]">
              Decision Recorded
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review the AI prediction and reasoning below before making a final
          triage decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Prediction + Confidence */}
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                AI Prediction
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {result.prediction}
              </p>
            </div>
            {confidencePct !== null && (
              <div className="flex flex-col items-center gap-1">
                <Gauge className="size-5 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {confidencePct}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Confidence
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Clinical Flags */}
          {result.flags && result.flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.flags.map((flag, i) => (
                <Badge
                  key={i}
                  variant={
                    flag.startsWith("CRITICAL") ? "destructive"
                    : flag.startsWith("WARNING") ? "warning"
                    : "secondary"
                  }
                  className="text-[10px]"
                >
                  {flag}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Reasoning */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Medical Reasoning / Explainability
            </p>
            <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
              {result.reasoning}
            </div>
          </div>
        </div>

        {/* ── The Kill Switch ── */}
        {!decided && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
              <ShieldAlert className="size-4 text-warning" />
              <p className="text-sm font-medium text-warning">
                Human review required — approve or override the AI decision.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Approve */}
              <Button
                size="lg"
                className="flex items-center gap-2 bg-success hover:bg-success/90 text-white"
                onClick={onApprove}
              >
                <CheckCircle2 className="size-5" />
                Approve AI Decision
              </Button>

              {/* Override */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Override — select correct level:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TRIAGE_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={selectedOverride === level ? "destructive" : "outline"}
                      size="sm"
                      className={`text-xs ${
                        selectedOverride === level 
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                          : "border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                      }`}
                      onClick={() => {
                        setSelectedOverride(level);
                        setOverrideReason("");
                      }}
                    >
                      <XCircle className="mr-1 size-3" />
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Override Reason Box */}
            {selectedOverride && (
              <div className="mt-3 flex flex-col gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 animate-in slide-in-from-top-2">
                <label htmlFor="reason" className="text-xs font-semibold text-destructive">
                  Reason for Rejecting AI Decision *
                </label>
                <textarea
                  id="reason"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Explain why the AI prediction was incorrect..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                />
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="self-end mt-1 text-xs"
                  disabled={overrideReason.trim().length === 0}
                  onClick={() => {
                    onOverride(selectedOverride, overrideReason);
                    setSelectedOverride(null);
                  }}
                >
                  Submit Override
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
