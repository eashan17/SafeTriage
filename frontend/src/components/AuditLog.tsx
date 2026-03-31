import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, RefreshCcw } from "lucide-react";
import { fetchAuditLogs, type AuditRecord } from "@/lib/api";

export function AuditLog() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch {
      // Silently fail — backend may not be running yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              Audit Trail
            </CardTitle>
            <CardDescription>
              Immutable log of all triage decisions.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ScrollText className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No audit records yet. Complete a triage to see records here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Time (UTC)</th>
                  <th className="pb-2 pr-4">AI Prediction</th>
                  <th className="pb-2 pr-4">Human Decision</th>
                  <th className="pb-2">Final Level</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                      {log.id}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">{log.ai_prediction}</td>
                    <td className="py-2.5 pr-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={log.human_decision === "Approved" ? "success" : "destructive"}
                        >
                          {log.human_decision}
                        </Badge>
                        {log.human_override_reason && (
                          <div className="mt-1 max-w-[200px] text-[10px] leading-tight text-muted-foreground">
                            <span className="font-semibold text-destructive/80">Reason:</span> {log.human_override_reason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 font-medium">{log.final_triage_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
