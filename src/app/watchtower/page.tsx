"use client";

import { useState, useCallback } from "react";
import {
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import type {
  Recommendation,
  RecommendationStatus,
  Alert,
  ChangeSeverity,
} from "@/lib/types";

interface DetectedChange {
  signal_type: string;
  field: string;
  previous_value: number | string;
  new_value: number | string;
  severity: ChangeSeverity;
  description: string;
  requires_action: boolean;
}

interface IntradayResponse {
  changes: DetectedChange[];
  updated_recommendations: Recommendation[];
  alerts: Alert[];
}

const SEVERITY_COLORS: Record<ChangeSeverity, { badge: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  low: { badge: "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]", border: "border-[var(--border)]", icon: Info },
  medium: { badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", border: "border-yellow-500/30", icon: AlertCircle },
  high: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/30", border: "border-orange-500/30", icon: AlertTriangle },
  critical: { badge: "bg-[var(--destructive)]/20 text-[var(--destructive)] border-[var(--destructive)]/30", border: "border-[var(--destructive)]/30", icon: AlertTriangle },
};

const STATUS_COLORS: Record<RecommendationStatus, string> = {
  suggested: "bg-[var(--accent)]/15 text-[var(--accent)]",
  accepted: "bg-[var(--success)]/15 text-[var(--success)]",
  active: "bg-green-500/15 text-green-400",
  updated: "bg-[var(--warning)]/15 text-[var(--warning)]",
  cancelled: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
  completed: "bg-emerald-500/15 text-emerald-400",
  ignored: "bg-[var(--muted)]/50 text-[var(--muted-foreground)]",
};

const SIMULATION_SCENARIOS = [
  { label: "Event Postponed (Pharmacy)", simulate: "pharmacy_event_postponed" },
  { label: "Rain Spike (Convenience Store)", simulate: "convenience_rain_spike" },
  { label: "Wind Increase (Cafe)", simulate: "cafe_wind_increase" },
] as const;

function RadarAnimation() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
      <div className="absolute inset-0 rounded-full border border-[var(--accent)]/20" />
      <div className="absolute inset-3 rounded-full border border-[var(--accent)]/15" />
      <div className="absolute inset-6 rounded-full border border-[var(--accent)]/10" />
      <div className="absolute inset-0 rounded-full border-t-2 border-[var(--accent)]/50 animate-spin" style={{ animationDuration: "3s" }} />
      <Eye className="size-6 text-[var(--accent)]" />
    </div>
  );
}

export default function WatchtowerPage() {
  const { businessId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [data, setData] = useState<IntradayResponse | null>(null);
  const [activeRecs, setActiveRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchIntraday = useCallback(async (simulate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { business_id: businessId };
      if (simulate) body.simulate = simulate;
      const res = await fetch("/api/agent/intraday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const result: IntradayResponse = await res.json();
      setData(result);
      setLastChecked(new Date());

      const updatedIds = new Set(result.updated_recommendations.map((r) => r.id));
      setActiveRecs((prev) => {
        const kept = prev.filter((r) => !updatedIds.has(r.id));
        const active = result.updated_recommendations.filter(
          (r) => r.status === "active" || r.status === "accepted" || r.status === "suggested"
        );
        return [...kept, ...active];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const changes = data?.changes ?? [];
  const updatedRecs = data?.updated_recommendations ?? [];
  const alerts = data?.alerts ?? [];
  const hasUpdates = changes.length > 0 || updatedRecs.length > 0 || alerts.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Eye className="size-5 text-[var(--accent)]" />
            Watchtower
          </h2>
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-3 h-8 text-sm font-medium text-[var(--warning)] hover:bg-[var(--warning)]/20 transition-colors",
                loading && "opacity-50 pointer-events-none"
              )}
            >
              <Zap className="size-4" />
              Simulate Update
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SIMULATION_SCENARIOS.map((s) => (
                <DropdownMenuItem key={s.simulate} onClick={() => fetchIntraday(s.simulate)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => fetchIntraday()} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh Now
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-[var(--destructive)]/30">
          <CardContent className="text-sm text-[var(--destructive)]">{error}</CardContent>
        </Card>
      )}

      {/* Active Recommendations */}
      {activeRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--success)]" />
              Active Recommendations
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {activeRecs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeRecs.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2">
                <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", STATUS_COLORS[rec.status])}>
                  {rec.status}
                </Badge>
                <span className="text-sm text-white truncate flex-1">{rec.title}</span>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {new Date(rec.last_validated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-340px)]">
        {!hasUpdates ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <RadarAnimation />
              <CardDescription className="text-base">No changes detected</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                Watchtower is monitoring. Use &quot;Simulate Update&quot; to test scenarios.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Alerts */}
            {alerts.length > 0 && (
              <Card className="border-[var(--destructive)]/20">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--destructive)]">
                    <AlertTriangle className="size-4" />
                    Alerts
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5 ml-1">
                      {alerts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.map((alert) => {
                    const sev = SEVERITY_COLORS[alert.severity as ChangeSeverity] ?? SEVERITY_COLORS.medium;
                    const Icon = sev.icon;
                    return (
                      <div key={alert.id} className={cn("rounded-md border p-3 space-y-1", sev.border)}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 shrink-0" />
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", sev.badge)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium text-white">{alert.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground font-mono">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{alert.message}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Signal Changes Feed */}
            {changes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Radio className="size-4 text-[var(--accent)]" />
                    Signal Changes
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                      {changes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-4">
                    <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                    {changes.map((change, i) => {
                      const sev = SEVERITY_COLORS[change.severity];
                      const Icon = sev.icon;
                      return (
                        <div key={i} className="relative pb-4 last:pb-0">
                          <div className={cn("absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-background", {
                            "bg-[var(--muted-foreground)]": change.severity === "low",
                            "bg-yellow-400": change.severity === "medium",
                            "bg-orange-400": change.severity === "high",
                            "bg-[var(--destructive)]": change.severity === "critical",
                          })} />
                          <div className="ml-4 rounded-md border border-border bg-background/50 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", sev.badge)}>
                                {change.severity}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                {change.signal_type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 mb-1">{change.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                {String(change.previous_value)}
                              </span>
                              <ArrowRight className="size-3 shrink-0" />
                              <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                {String(change.new_value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Updated/Cancelled Recommendations */}
            {updatedRecs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="size-4 text-[var(--warning)]" />
                    Updated Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {updatedRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className={cn(
                        "rounded-md border p-3",
                        rec.status === "cancelled"
                          ? "border-[var(--destructive)]/20 bg-[var(--destructive)]/5"
                          : "border-[var(--warning)]/20 bg-[var(--warning)]/5"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {rec.status === "cancelled" ? (
                          <XCircle className="size-4 text-[var(--destructive)]" />
                        ) : (
                          <RefreshCw className="size-4 text-[var(--warning)]" />
                        )}
                        <span className={cn(
                          "text-sm font-medium",
                          rec.status === "cancelled" && "line-through text-muted-foreground"
                        )}>
                          {rec.title}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 ml-auto", STATUS_COLORS[rec.status])}>
                          {rec.status}
                        </Badge>
                      </div>
                      {rec.update_reason && (
                        <p className="text-xs text-muted-foreground pl-6">
                          Reason: {rec.update_reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground pl-6 mt-0.5">
                        {rec.action}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
