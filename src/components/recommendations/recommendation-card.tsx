import {
  Package,
  Users,
  Megaphone,
  LayoutGrid,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "./priority-badge";
import { StatusBadge } from "./status-badge";
import type { Recommendation, RecommendationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  RecommendationType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  inventory: {
    icon: <Package className="size-3.5" />,
    label: "Inventory",
    color: "var(--signal-blue)",
  },
  staffing: {
    icon: <Users className="size-3.5" />,
    label: "Staffing",
    color: "#b877d9",
  },
  marketing: {
    icon: <Megaphone className="size-3.5" />,
    label: "Marketing",
    color: "var(--revenue-green)",
  },
  layout: {
    icon: <LayoutGrid className="size-3.5" />,
    label: "Layout",
    color: "var(--warning)",
  },
  hours: {
    icon: <Clock className="size-3.5" />,
    label: "Hours",
    color: "var(--dispatch-cyan)",
  },
  alert: {
    icon: <AlertTriangle className="size-3.5" />,
    label: "Alert",
    color: "var(--destructive)",
  },
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick?: () => void;
  compact?: boolean;
}

export function RecommendationCard({
  recommendation,
  onClick,
  compact = false,
}: RecommendationCardProps) {
  const typeInfo = typeConfig[recommendation.recommendation_type];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-150",
        onClick && "cursor-pointer hover:border-[var(--signal-blue)]/25 hover:shadow-[0_0_15px_rgba(95,168,255,0.04)]"
      )}
      onClick={onClick}
    >
      <div
        className="absolute top-0 left-0 h-[2px] w-full opacity-50"
        style={{ background: typeInfo.color }}
      />
      <CardContent className={cn(compact ? "py-3" : "pt-5")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={recommendation.priority} />
              <span
                className="inline-flex items-center gap-1 text-xs font-mono"
                style={{ color: typeInfo.color }}
              >
                {typeInfo.icon}
                {typeInfo.label}
              </span>
              <StatusBadge status={recommendation.status} />
            </div>

            <h4 className="text-sm font-medium text-white leading-tight">
              {recommendation.title}
            </h4>

            {!compact && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {recommendation.action}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="size-3" />
                {recommendation.time_window}
              </span>
              <ConfidenceIndicator confidence={recommendation.confidence} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct > 70
      ? "bg-[var(--revenue-green)]"
      : pct >= 40
        ? "bg-[var(--warning)]"
        : "bg-[var(--destructive)]";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground font-mono">{pct}%</span>
      <span className="relative h-1.5 w-12 rounded-full bg-[var(--muted)]/50 overflow-hidden">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
