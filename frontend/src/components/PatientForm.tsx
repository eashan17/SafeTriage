import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, RotateCcw, User, Heart, Thermometer, Wind, Activity } from "lucide-react";
import type { PredictRequest, PatientVitals, ArrivalMode } from "@/lib/api";

interface PatientFormProps {
  onSubmit: (data: PredictRequest) => void;
  isLoading: boolean;
  isLocked: boolean;
}

const INITIAL_VITALS: PatientVitals = {
  age: 45,
  heart_rate: 80,
  systolic_blood_pressure: 120,
  oxygen_saturation: 98,
  body_temperature: 36.6,
  pain_level: 3,
  chronic_disease_count: 0,
  previous_er_visits: 0,
  arrival_mode: "walk_in",
};

export function PatientForm({ onSubmit, isLoading, isLocked }: PatientFormProps) {
  const [patientId, setPatientId] = useState<string>(crypto.randomUUID());
  const [vitals, setVitals] = useState<PatientVitals>({ ...INITIAL_VITALS });

  function update<K extends keyof PatientVitals>(key: K, value: PatientVitals[K]) {
    setVitals((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ patient_id: patientId, vitals });
  }

  function handleReset() {
    setPatientId(crypto.randomUUID());
    setVitals({ ...INITIAL_VITALS });
  }

  return (
    <Card className="transition-opacity duration-300" style={{ opacity: isLocked ? 0.5 : 1 }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
            1
          </span>
          Patient Intake
        </CardTitle>
        <CardDescription>
          Enter patient vitals for AI triage assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Patient ID */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patient-id" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3" /> Patient Session ID
            </Label>
            <Input
              id="patient-id"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={isLocked}
              className="font-mono text-xs h-8"
            />
          </div>

          {/* ── Vitals Grid ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Age */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="age" className="flex items-center gap-1 text-xs">
                <User className="size-3 text-muted-foreground" /> Age (years)
              </Label>
              <Input
                id="age" type="number" min={0} max={120}
                value={vitals.age}
                onChange={(e) => update("age", parseInt(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Heart Rate */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="heart_rate" className="flex items-center gap-1 text-xs">
                <Heart className="size-3 text-red-400" /> Heart Rate (bpm)
              </Label>
              <Input
                id="heart_rate" type="number" min={0} step="0.1"
                value={vitals.heart_rate}
                onChange={(e) => update("heart_rate", parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Systolic BP */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="systolic_bp" className="flex items-center gap-1 text-xs">
                <Activity className="size-3 text-blue-500" /> Systolic BP (mmHg)
              </Label>
              <Input
                id="systolic_bp" type="number" min={0} step="0.1"
                value={vitals.systolic_blood_pressure}
                onChange={(e) => update("systolic_blood_pressure", parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* O₂ Saturation */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="o2_sat" className="flex items-center gap-1 text-xs">
                <Wind className="size-3 text-cyan-500" /> SpO₂ (%)
              </Label>
              <Input
                id="o2_sat" type="number" min={0} max={100} step="0.1"
                value={vitals.oxygen_saturation}
                onChange={(e) => update("oxygen_saturation", parseFloat(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Body Temperature */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="body_temp" className="flex items-center gap-1 text-xs">
                <Thermometer className="size-3 text-orange-400" /> Temp (°C)
              </Label>
              <Input
                id="body_temp" type="number" min={25} max={45} step="0.1"
                value={vitals.body_temperature}
                onChange={(e) => update("body_temperature", parseFloat(e.target.value) || 36.0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Pain Level */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="pain_level" className="text-xs">
                🩹 Pain Level (1–10)
              </Label>
              <Input
                id="pain_level" type="number" min={1} max={10}
                value={vitals.pain_level}
                onChange={(e) => update("pain_level", parseInt(e.target.value) || 1)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Chronic Disease Count */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="chronic_diseases" className="text-xs">
                🏥 Chronic Conditions
              </Label>
              <Input
                id="chronic_diseases" type="number" min={0}
                value={vitals.chronic_disease_count}
                onChange={(e) => update("chronic_disease_count", parseInt(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>

            {/* Previous ER Visits */}
            <div className="flex flex-col gap-1">
              <Label htmlFor="er_visits" className="text-xs">
                🚑 Previous ER Visits
              </Label>
              <Input
                id="er_visits" type="number" min={0}
                value={vitals.previous_er_visits}
                onChange={(e) => update("previous_er_visits", parseInt(e.target.value) || 0)}
                disabled={isLocked}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Arrival Mode */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="arrival_mode" className="text-xs">
              🚶 Arrival Mode
            </Label>
            <select
              id="arrival_mode"
              value={vitals.arrival_mode}
              onChange={(e) => update("arrival_mode", e.target.value as ArrivalMode)}
              disabled={isLocked}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="walk_in">Walk-in</option>
              <option value="wheelchair">Wheelchair</option>
              <option value="ambulance">Ambulance</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading || isLocked} className="flex-1">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="size-4" />
                  Submit for Triage
                </span>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isLocked}>
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
