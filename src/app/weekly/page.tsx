"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Eye,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { PriorityBadge } from "@/components/recommendations/priority-badge";
import { useBusiness } from "@/context/business-context";
import type { Recommendation, AgentRun } from "@/lib/types";
import type { Event } from "@/lib/types/events";
import { cn } from "@/lib/utils";

interface DayPlan {
  date: string;
  day_label: string;
  opportunity_score: number;
  risk_score: number;
  summary: string;
  recommendations: Recommendation[];
}

interface WeeklyData {
  run: AgentRun;
  recommendations: Recommendation[];
  weekly_summary: {
    text: string;
    highest_opportunity_day: string;
    highest_risk_day: string;
    watchlist: string[];
  };
  days: DayPlan[];
  events?: Event[];
}

export default function WeeklyPlanPage() {
  const { businessId, setBusinessId, business: selectedBusiness, businesses } = useBusiness();
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCached() {
      try {
        const res = await fetch(`/api/agent/weekly?business_id=${businessId}`);
        if (res.ok && !cancelled) {
          const cached = await res.json();
          if (cached) setData(cached);
        }
      } catch { /* no cached data */ }
      if (!cancelled) setInitialLoading(false);
    }
    setData(null);
    setSelectedDay(null);
    setInitialLoading(true);
    loadCached();
    return () => { cancelled = true; };
  }, [businessId]);

  async function generatePlan() {
    setLoading(true);
    setData(null);
    setSelectedDay(null);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const res = await fetch("/api/agent/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Server error (${res.status})`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out. The plan generation took too long — please try again.");
      } else {
        setError("Network error — could not reach the server.");
      }
    } finally {
      setLoading(false);
    }
  }
  const activeDayData = selectedDay !== null ? data?.days[selectedDay] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Weekly Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            7-day strategic planner powered by real-time signal analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={businessId} onValueChange={(v) => v && setBusinessId(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
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
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            {loading ? "Generating..." : "Generate Plan"}
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <Card className="border-[var(--border)]">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-10 text-[var(--primary)] animate-spin mb-4" />
            <h3 className="text-base font-semibold text-white mb-1">
              Generating weekly plan...
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyzing weather, events, air quality, and market signals for{" "}
              {selectedBusiness?.name}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-[var(--destructive)]/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="size-8 text-[var(--destructive)] mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Generation Failed</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
            <Button variant="outline" onClick={generatePlan}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !initialLoading && !data && !error && (
        <Card className="border-[var(--border)] border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-[var(--primary)]/10 p-4 mb-4">
              <CalendarDays className="size-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Weekly Plan Generated
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Select a business and generate a 7-day strategic plan. SkyPulse
              will analyze local signals and provide actionable recommendations.
            </p>
            <Button size="lg" onClick={generatePlan}>
              <Sparkles className="size-4 mr-2" />
              Generate Weekly Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Content */}
      {!loading && data && (
        <>
          {/* 7-Day Calendar Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {data.days.map((day, idx) => (
              <DayCard
                key={day.date}
                day={day}
                isSelected={selectedDay === idx}
                onClick={() =>
                  setSelectedDay(selectedDay === idx ? null : idx)
                }
              />
            ))}
          </div>

          {/* Day Detail Panel */}
          {activeDayData && (
            <Card className="border-[var(--accent)]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="size-4 text-[var(--accent)]" />
                  {activeDayData.day_label} — {activeDayData.date}
                </CardTitle>
                <CardDescription>{activeDayData.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Events for this day */}
                {(() => {
                  const dayEvents = (data?.events ?? []).filter(e => e.date === activeDayData.date);
                  if (dayEvents.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                        Nearby Events
                      </h4>
                      <div className="space-y-2">
                        {dayEvents.map((evt) => (
                          <div key={evt.id} className="flex items-start gap-3 rounded-md border border-purple-500/20 bg-purple-500/5 p-3">
                            <CalendarClock className="size-4 text-purple-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{evt.name}</p>
                              <p className="text-xs text-muted-foreground">{evt.venue} · {evt.start_time}–{evt.end_time}</p>
                              <p className="text-xs text-purple-300 mt-1">{evt.business_relevance}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-purple-500/30 text-purple-400 shrink-0">
                              {evt.estimated_attendance}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Recommendations for this day */}
                <div>
                  <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Recommendations
                  </h4>
                  <div className="space-y-3">
                    {activeDayData.recommendations.length > 0 ? (
                      activeDayData.recommendations.map((rec) => (
                        <RecommendationCard
                          key={rec.id}
                          recommendation={rec}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        No specific recommendations for this day.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly Summary */}
          <Card className="border-[var(--border)]">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[var(--success)]/10 p-2">
                    <TrendingUp className="size-4 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Highest Opportunity
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {data.weekly_summary?.highest_opportunity_day ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[var(--destructive)]/10 p-2">
                    <AlertTriangle className="size-4 text-[var(--destructive)]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Highest Risk
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {data.weekly_summary?.highest_risk_day ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[var(--warning)]/10 p-2">
                    <Eye className="size-4 text-[var(--warning)]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Watchlist</p>
                    <div className="space-y-0.5">
                      {(data.weekly_summary?.watchlist ?? []).map((item, i) => (
                        <p
                          key={i}
                          className="text-sm text-foreground"
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function DayCard({
  day,
  isSelected,
  onClick,
}: {
  day: DayPlan;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={cn(
        "border-[var(--border)] cursor-pointer transition-all hover:bg-[#1e2228]",
        isSelected && "border-[var(--accent)] bg-[var(--accent)]/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {day.day_label?.split(" ")[0]?.slice(0, 3) ?? day.date?.slice(5)}
          </span>
          <ChevronRight
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              isSelected && "rotate-90"
            )}
          />
        </div>

        {/* Opportunity Score */}
        <div className="text-center">
          <ScoreGauge
            score={day.opportunity_score}
            label=""
            size="sm"
          />
        </div>

        {/* Risk */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Risk</span>
          <span className="font-mono text-[var(--warning)]">
            {day.risk_score}
          </span>
        </div>

        {/* Label */}
        <p className="text-[10px] text-muted-foreground text-center truncate">
          {day.day_label}
        </p>

        {/* Main rec title */}
        {day.recommendations?.[0] && (
          <p className="text-[10px] text-foreground truncate">
            {day.recommendations[0].title}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
