"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Sun,
  Radio,
  Sparkles,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { useBusiness } from "@/context/business-context";
import type { Recommendation, AgentRun, Business } from "@/lib/types";

interface DashboardData {
  run: AgentRun | null;
  recommendations: Recommendation[];
  weekly_summary: {
    highest_opportunity_day: string;
    highest_risk_day: string;
    watchlist: string[];
  } | null;
}

function getScoreColorClass(score: number): string {
  if (score > 70) return "text-[var(--success)]";
  if (score >= 40) return "text-[var(--warning)]";
  return "text-[var(--destructive)]";
}

export default function DashboardPage() {
  const router = useRouter();
  const { business } = useBusiness();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/recommendations?business_id=${business.id}`);
        if (res.ok) {
          const json = await res.json();
          const recs: Recommendation[] = json.recommendations ?? [];
          setData({
            run: null,
            recommendations: recs,
            weekly_summary: null,
          });
        }
      } catch {
        // API not available yet — show empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [business.id]);

  const hasData =
    data && (data.recommendations.length > 0 || data.run !== null);
  const opportunityScore = data?.run?.overall_opportunity_score ?? 0;
  const riskScore = data?.run?.overall_risk_score ?? 0;
  const readinessScore = hasData ? Math.max(0, 100 - riskScore) : 0;
  const activeAlerts = data?.recommendations.filter(
    (r) => r.recommendation_type === "alert" && r.status !== "completed"
  ).length ?? 0;
  const topRecs = data?.recommendations
    .filter((r) => r.status === "suggested" || r.status === "active")
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3) ?? [];
  const nextAction = topRecs[0] ?? null;

  if (loading) {
    return (
      <div className="space-y-6">
        <BusinessHeader business={business} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-[var(--border)] animate-pulse">
              <CardContent className="pt-4">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <BusinessHeader business={business} />
        <Card className="border-[var(--border)] border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[var(--primary)]/10 p-4 mb-4">
              <Sparkles className="size-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Welcome to SkyPulse
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Generate your first weekly plan to get data-driven recommendations
              for your business based on weather, events, and local signals.
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/weekly")}
            >
              <CalendarDays className="size-4 mr-2" />
              Generate Weekly Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BusinessHeader business={business} />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Weekly Opportunity"
          value={opportunityScore}
          subtitle="Opportunity score"
          colorClass={getScoreColorClass(opportunityScore)}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          title="Tomorrow Readiness"
          value={readinessScore}
          subtitle="Readiness score"
          colorClass={getScoreColorClass(readinessScore)}
          icon={<ShieldCheck className="size-4" />}
        />
        <StatCard
          title="Active Alerts"
          value={activeAlerts}
          subtitle={activeAlerts > 0 ? "Requires attention" : "All clear"}
          colorClass={
            activeAlerts > 0 ? "text-[var(--destructive)]" : "text-foreground"
          }
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Recommendations */}
        <div className="lg:col-span-2">
          <Card className="border-[var(--border)]">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Top Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRecs.length > 0 ? (
                topRecs.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    compact
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No active recommendations. Generate a plan to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Action Window */}
        <div className="lg:col-span-1">
          <Card className="border-[var(--accent)]/30 bg-[var(--accent)]/5">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
                Next Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextAction ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white">
                    {nextAction.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {nextAction.action}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{nextAction.time_window}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No pending actions
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-[var(--border)] mt-4">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => router.push("/weekly")}
              >
                <CalendarDays className="size-4 mr-2" />
                Weekly Plan
                <ArrowRight className="size-3 ml-auto" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => router.push("/tomorrow")}
              >
                <Sun className="size-4 mr-2" />
                Tomorrow Plan
                <ArrowRight className="size-3 ml-auto" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => router.push("/watchtower")}
              >
                <Radio className="size-4 mr-2" />
                Watchtower
                <ArrowRight className="size-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BusinessHeader({ business }: { business: Business }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {business.name}
        </h1>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3" />
          {business.address}
        </p>
      </div>
    </div>
  );
}

