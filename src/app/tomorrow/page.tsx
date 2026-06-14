"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Mail,
  CalendarClock,
  Zap,
  Loader2,
  Sparkles,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import type {
  Recommendation,
  AgentRun,
  Priority,
  RecommendationType,
} from "@/lib/types";

interface TimeBlock {
  start: string;
  end: string;
  weather: { temp: number; icon: string; description: string; rain: boolean; uv: number };
  recommendations: Recommendation[];
  isCampaignWindow?: boolean;
  isEventWindow?: boolean;
  eventName?: string;
}

interface DayPlanResponse {
  run: AgentRun;
  recommendations: Recommendation[];
  time_blocks: TimeBlock[];
  daily_summary: {
    date: string;
    opportunity_score: number;
    risk_score: number;
    summary: string;
  };
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "bg-[var(--destructive)]/20 text-[var(--destructive)] border-[var(--destructive)]/30",
  high: "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  medium: "bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30",
  low: "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]",
};

const TYPE_COLORS: Record<RecommendationType, string> = {
  inventory: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  staffing: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  marketing: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  layout: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  hours: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  alert: "bg-red-500/15 text-red-400 border-red-500/30",
};

function WeatherIcon({ icon, className }: { icon: string; className?: string }) {
  const props = { className: cn("size-4", className) };
  switch (icon) {
    case "rain": return <CloudRain {...props} />;
    case "sun": return <Sun {...props} />;
    case "wind": return <Wind {...props} />;
    default: return <Cloud {...props} />;
  }
}

function tempGradient(temp: number): string {
  if (temp >= 35) return "from-red-500/40 to-red-500/10";
  if (temp >= 30) return "from-orange-500/40 to-orange-500/10";
  if (temp >= 25) return "from-yellow-500/30 to-yellow-500/10";
  if (temp >= 20) return "from-green-500/30 to-green-500/10";
  if (temp >= 15) return "from-cyan-500/30 to-cyan-500/10";
  return "from-blue-500/30 to-blue-500/10";
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function SkeletonTimeline() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-16 shrink-0">
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
          <div className="flex-1 rounded-lg bg-card border border-border p-4 space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-20 rounded bg-muted/50" />
              <div className="h-20 rounded bg-muted/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TomorrowPlanPage() {
  const { businessId, setBusinessId, business: selectedBusiness, businesses } = useBusiness();
  const [planData, setPlanData] = useState<DayPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    generatedRef.current = false;
    async function loadCached() {
      try {
        const res = await fetch(`/api/agent/day-ahead?business_id=${businessId}`);
        if (res.ok && !cancelled && !generatedRef.current) {
          const cached = await res.json();
          if (cached) setPlanData(cached);
        }
      } catch { /* no cached data */ }
      if (!cancelled) setInitialLoading(false);
    }
    setPlanData(null);
    setError(null);
    setInitialLoading(true);
    loadCached();
    return () => { cancelled = true; };
  }, [businessId]);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    generatedRef.current = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const res = await fetch("/api/agent/day-ahead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, date: tomorrowDate() }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Failed to generate plan (${res.status})`);
      }
      const data: DayPlanResponse = await res.json();
      setPlanData(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Request timed out — plan generation took too long. Please try again.");
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const date = tomorrowDate();
  const summary = planData?.daily_summary;
  const timeBlocks = planData?.time_blocks ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white">Tomorrow&apos;s Plan</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={businessId} onValueChange={(v) => v && setBusinessId(v)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select business">{selectedBusiness?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generatePlan} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate Plan
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-[var(--destructive)]/30">
          <CardContent className="text-sm text-[var(--destructive)]">{error}</CardContent>
        </Card>
      )}

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 text-[var(--accent)]" />
              Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-3">
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Opportunity</span>
                <p className="text-2xl font-mono font-semibold text-[var(--success)]">
                  {summary.opportunity_score}
                  <span className="text-xs text-muted-foreground font-normal">/100</span>
                </p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Risk</span>
                <p className="text-2xl font-mono font-semibold text-[var(--warning)]">
                  {summary.risk_score}
                  <span className="text-xs text-muted-foreground font-normal">/100</span>
                </p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <p className="text-sm text-muted-foreground flex-1">{summary.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {loading ? (
        <SkeletonTimeline />
      ) : timeBlocks.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="relative pl-2">
            {/* Vertical line */}
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border" />

            {timeBlocks.map((block, i) => (
              <div key={i} className="relative flex gap-4 mb-5">
                {/* Time marker */}
                <div className="w-16 shrink-0 pt-1 text-right">
                  <span className="text-xs font-mono text-muted-foreground">{block.start}</span>
                </div>

                {/* Timeline dot */}
                <div className="relative z-10 mt-2 shrink-0">
                  <div
                    className={cn(
                      "size-3 rounded-full border-2 border-background",
                      block.isEventWindow
                        ? "bg-purple-500"
                        : block.isCampaignWindow
                        ? "bg-pink-500"
                        : "bg-[var(--accent)]"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Time block header */}
                  <div
                    className={cn(
                      "rounded-lg border border-border overflow-hidden",
                      block.isEventWindow && "border-purple-500/30"
                    )}
                  >
                    {/* Weather strip */}
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 bg-gradient-to-r",
                        tempGradient(block.weather.temp)
                      )}
                    >
                      <WeatherIcon icon={block.weather.icon} />
                      <span className="text-xs font-mono font-medium">
                        {block.weather.temp}°C
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {block.weather.description}
                      </span>
                      {block.weather.rain && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-blue-500/30 text-blue-400">
                          <CloudRain className="size-3 mr-0.5" />
                          Rain
                        </Badge>
                      )}
                      {block.weather.uv >= 6 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-yellow-500/30 text-yellow-400">
                          <Sun className="size-3 mr-0.5" />
                          UV {block.weather.uv}
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground font-mono">
                        {block.start} – {block.end}
                      </span>
                    </div>

                    {/* Event overlay */}
                    {block.isEventWindow && block.eventName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border-t border-purple-500/20">
                        <CalendarClock className="size-3 text-purple-400" />
                        <span className="text-xs text-purple-300">{block.eventName}</span>
                      </div>
                    )}

                    {/* Campaign marker */}
                    {block.isCampaignWindow && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border-t border-pink-500/20">
                        <Mail className="size-3 text-pink-400" />
                        <span className="text-xs text-pink-300">Campaign send window</span>
                      </div>
                    )}

                    {/* Recommendation cards */}
                    {block.recommendations.length > 0 && (
                      <div className="p-2 space-y-2 bg-card">
                        {block.recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-start gap-3 rounded-md border border-border bg-background/50 p-3 hover:bg-background/80 transition-colors"
                          >
                            <div className="shrink-0 mt-0.5">
                              <Zap className="size-4 text-[var(--accent)]" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] h-4 px-1.5", PRIORITY_COLORS[rec.priority])}
                                >
                                  {rec.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] h-4 px-1.5", TYPE_COLORS[rec.recommendation_type])}
                                >
                                  {rec.recommendation_type}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-foreground truncate">
                                {rec.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {rec.action}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-mono">
                                  {Math.round(rec.confidence * 100)}%
                                </span>
                                <span>conf.</span>
                                <span className="ml-auto font-mono">{rec.time_window}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : !loading && !initialLoading && !planData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Thermometer className="size-10 text-muted-foreground/40 mb-3" />
            <CardDescription className="text-base">No plan generated yet</CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Select a business and click &quot;Generate Plan&quot; to see tomorrow&apos;s timeline.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
