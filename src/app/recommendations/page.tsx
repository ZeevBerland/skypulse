"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Lightbulb,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  X,
  CheckCircle2,
  Loader2,
  Inbox,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import { RecommendationDrawer } from "@/components/recommendations/recommendation-drawer";
import type {
  Recommendation,
  Priority,
  RecommendationType,
  RecommendationStatus,
} from "@/lib/types";

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

const STATUS_COLORS: Record<RecommendationStatus, string> = {
  suggested: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30",
  accepted: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  updated: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30",
  cancelled: "bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ignored: "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]",
};

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type SortKey = "priority" | "date" | "confidence";

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("priority");
  const [drawerRec, setDrawerRec] = useState<Recommendation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { businessId } = useBusiness();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/recommendations?business_id=${businessId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.recommendations) setRecs(data.recommendations);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setRecs((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: status as RecommendationStatus, updated_at: new Date().toISOString() } : r))
        );
      }
    } catch {
      // silent fail
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const filtered = recs
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => typeFilter === "all" || r.recommendation_type === typeFilter)
    .filter((r) => priorityFilter === "all" || r.priority === priorityFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "confidence":
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });

  const openDrawer = (rec: Recommendation) => {
    setDrawerRec(rec);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Lightbulb className="size-5 text-[var(--accent)]" />
          Recommendations
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filtered.length} recommendation{filtered.length !== 1 ? "s" : ""} showing
        </p>
      </div>

      {/* Filters Row */}
      <Card>
        <CardContent className="flex items-center gap-3 flex-wrap py-3">
          <SlidersHorizontal className="size-4 text-muted-foreground shrink-0" />

          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="suggested">Suggested</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="staffing">Staffing</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="layout">Layout</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-2.5 h-8 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                <ArrowUpDown className="size-3.5" />
                Sort: {sortBy}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("priority")}>Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")}>Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("confidence")}>Confidence</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      <ScrollArea className="h-[calc(100vh-310px)]">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="size-10 text-muted-foreground/40 mb-3" />
              <CardDescription className="text-base">
                {recs.length === 0
                  ? "No recommendations yet"
                  : "No recommendations match filters"}
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                {recs.length === 0
                  ? "Generate a plan first to see recommendations here."
                  : "Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((rec) => (
              <Card
                key={rec.id}
                className="cursor-pointer hover:ring-1 hover:ring-[var(--accent)]/20 transition-all"
                onClick={() => openDrawer(rec)}
              >
                <CardContent className="flex items-start gap-4 py-3">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-4 px-1.5", PRIORITY_COLORS[rec.priority])}
                    >
                      {rec.priority}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {rec.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{rec.action}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", TYPE_COLORS[rec.recommendation_type])}>
                        {rec.recommendation_type}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", STATUS_COLORS[rec.status])}>
                        {rec.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="shrink-0 w-20 text-right">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          rec.confidence >= 0.8 ? "bg-[var(--success)]" : rec.confidence >= 0.5 ? "bg-[var(--warning)]" : "bg-[var(--destructive)]"
                        )}
                        style={{ width: `${rec.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {Math.round(rec.confidence * 100)}% conf
                    </span>
                  </div>

                  {/* Date / Time */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-mono text-muted-foreground">{rec.date}</p>
                    <p className="text-[10px] text-muted-foreground">{rec.time_window}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-[var(--success)] hover:bg-[var(--success)]/10"
                      onClick={() => updateStatus(rec.id, "accepted")}
                      disabled={updatingId === rec.id}
                    >
                      {updatingId === rec.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                      onClick={() => updateStatus(rec.id, "cancelled")}
                      disabled={updatingId === rec.id}
                    >
                      <X className="size-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => updateStatus(rec.id, "completed")}
                      disabled={updatingId === rec.id}
                    >
                      <CheckCircle2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <RecommendationDrawer
        recommendation={drawerRec}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerRec(null);
        }}
        onStatusChange={(id, status) => {
          updateStatus(id, status);
          setDrawerOpen(false);
          setDrawerRec(null);
        }}
      />
    </div>
  );
}
