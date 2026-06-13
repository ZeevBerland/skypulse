"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Binoculars,
  RefreshCw,
  Loader2,
  ExternalLink,
  Tag,
  Star,
  Package,
  DollarSign,
  Store,
  Newspaper,
  Share2,
  HelpCircle,
  Lightbulb,
  Clock,
  TrendingUp,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import type { CompetitorUpdate, CompetitorUpdateType } from "@/lib/types/competitors";

const UPDATE_TYPE_CONFIG: Record<
  CompetitorUpdateType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  promotion: { label: "Promotion", icon: Tag, color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  review_trend: { label: "Reviews", icon: Star, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  new_product: { label: "New Product", icon: Package, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  price_change: { label: "Price Change", icon: DollarSign, color: "bg-red-500/15 text-red-400 border-red-500/30" },
  store_change: { label: "Store Update", icon: Store, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  news: { label: "News", icon: Newspaper, color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  social_media: { label: "Social Media", icon: Share2, color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  other: { label: "Other", icon: HelpCircle, color: "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function relevanceBar(score: number) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)]/30 overflow-hidden max-w-[80px]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 0.7 ? "bg-[var(--destructive)]" : score >= 0.4 ? "bg-[var(--warning)]" : "bg-[var(--muted-foreground)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function CompetitorsPage() {
  const { business } = useBusiness();
  const [updates, setUpdates] = useState<CompetitorUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/competitors?business_id=${business.id}`);
      if (res.ok) {
        const data: CompetitorUpdate[] = await res.json();
        setUpdates(data);
      }
    } catch {
      // silent
    }
  }, [business.id]);

  useEffect(() => {
    setUpdates([]);
    setInitialLoad(true);
    fetchUpdates().finally(() => setInitialLoad(false));
  }, [fetchUpdates]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setLoading(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id }),
      });
      if (res.ok) {
        const data: CompetitorUpdate[] = await res.json();
        setUpdates(data);
      }
    } catch {
      // silent
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [business.id]);

  const grouped = new Map<string, CompetitorUpdate[]>();
  for (const u of updates) {
    const existing = grouped.get(u.competitor_name) ?? [];
    existing.push(u);
    grouped.set(u.competitor_name, existing);
  }

  const competitorNames = Array.from(grouped.keys());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Binoculars className="size-5 text-[var(--accent)]" />
            Competitor Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time activity feed for competitors near {business.name}.
          </p>
        </div>
        <Button variant="outline" onClick={runScan} disabled={loading}>
          {scanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {scanning ? "Scanning..." : "Scan Competitors"}
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        {initialLoad && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="size-8 animate-spin text-[var(--accent)] mb-4" />
              <CardDescription className="text-base">Loading competitor data...</CardDescription>
            </CardContent>
          </Card>
        )}

        {!initialLoad && updates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Binoculars className="size-10 text-muted-foreground/30 mb-4" />
              <CardDescription className="text-base">No competitor intelligence yet</CardDescription>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Click &quot;Scan Competitors&quot; to discover nearby competitors and analyze their recent activity.
              </p>
              <Button variant="outline" className="mt-4" onClick={runScan} disabled={loading}>
                {scanning ? <Loader2 className="size-4 animate-spin" /> : <Binoculars className="size-4" />}
                Start First Scan
              </Button>
            </CardContent>
          </Card>
        )}

        {!initialLoad && updates.length > 0 && (
          <div className="space-y-4">
            {/* Summary strip */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
                <Store className="size-3" />
                {competitorNames.length} competitor{competitorNames.length !== 1 ? "s" : ""} tracked
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
                <TrendingUp className="size-3" />
                {updates.length} update{updates.length !== 1 ? "s" : ""} found
              </Badge>
              {updates[0] && (
                <Badge variant="secondary" className="text-xs gap-1.5 py-1 px-2.5">
                  <Clock className="size-3" />
                  Last scan: {timeAgo(updates[0].discovered_at)}
                </Badge>
              )}
            </div>

            {/* Feed grouped by competitor */}
            {competitorNames.map((name) => {
              const items = grouped.get(name)!;
              return (
                <Card key={name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Store className="size-4 text-[var(--destructive)]" />
                      {name}
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-1 bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20">
                        Competitor
                      </Badge>
                      {items[0]?.competitor_address && (
                        <span className="text-xs font-normal text-muted-foreground ml-auto">
                          {items[0].competitor_address}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {items.map((update, i) => {
                      const config = UPDATE_TYPE_CONFIG[update.update_type] ?? UPDATE_TYPE_CONFIG.other;
                      const Icon = config.icon;
                      return (
                        <div key={update.id}>
                          <div className="rounded-md border border-border bg-background/50 p-3 space-y-2">
                            {/* Header row */}
                            <div className="flex items-start gap-2">
                              <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", config.color)}>
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm font-medium text-white">{update.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{update.summary}</p>
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {timeAgo(update.discovered_at)}
                                </span>
                                {relevanceBar(update.relevance_score)}
                              </div>
                            </div>

                            {/* Suggested response */}
                            {update.ai_suggestion && (
                              <div className="flex items-start gap-2 ml-6 rounded-md bg-[var(--accent)]/5 border border-[var(--accent)]/15 px-3 py-2">
                                <Lightbulb className="size-3.5 mt-0.5 shrink-0 text-[var(--accent)]" />
                                <p className="text-xs text-foreground/80">{update.ai_suggestion}</p>
                              </div>
                            )}

                            {/* Source link */}
                            {update.source_url && (
                              <a
                                href={update.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-6 inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
                              >
                                <ExternalLink className="size-3" />
                                Source
                              </a>
                            )}
                          </div>
                          {i < items.length - 1 && <Separator className="my-1" />}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
