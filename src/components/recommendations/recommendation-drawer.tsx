"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  X,
  Pencil,
  CheckCircle2,
  EyeOff,
  Clock,
  Zap,
  Signal,
  Target,
  BarChart3,
  Wrench,
  ShieldCheck,
  LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recommendation, Priority, RecommendationType, RecommendationStatus } from "@/lib/types";

interface RecommendationDrawerProps {
  recommendation: Recommendation | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
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

const STATUS_COLORS: Record<RecommendationStatus, string> = {
  suggested: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30",
  accepted: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  updated: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30",
  cancelled: "bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  ignored: "bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-[var(--border)]",
};

function DetailRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 80 ? "bg-[var(--success)]" : pct >= 50 ? "bg-[var(--warning)]" : "bg-[var(--destructive)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
    </div>
  );
}

export function RecommendationDrawer({ recommendation: rec, open, onClose, onStatusChange }: RecommendationDrawerProps) {
  if (!rec) return null;

  const handleStatus = (status: string) => {
    onStatusChange?.(rec.id, status);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} direction="right">
      <DrawerContent className="sm:max-w-lg w-full">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", PRIORITY_COLORS[rec.priority])}>
              {rec.priority}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", TYPE_COLORS[rec.recommendation_type])}>
              {rec.recommendation_type}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", STATUS_COLORS[rec.status])}>
              {rec.status}
            </Badge>
          </div>
          <DrawerTitle>{rec.title}</DrawerTitle>
          <DrawerDescription>{rec.action}</DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-1">
            <DetailRow icon={Zap} label="Why">
              {rec.why}
            </DetailRow>

            <Separator />

            <DetailRow icon={Signal} label="Source Signals">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {rec.source_signals.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
                    {s}
                  </Badge>
                ))}
              </div>
            </DetailRow>

            <Separator />

            <DetailRow icon={BarChart3} label="Confidence">
              <ConfidenceBar value={rec.confidence} />
            </DetailRow>

            <Separator />

            <DetailRow icon={Target} label="Expected Impact">
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-mono">{rec.expected_impact.revenue}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Stockout Risk Reduction</span>
                  <span className="font-mono">{rec.expected_impact.stockout_risk_reduction}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Customer Experience</span>
                  <span className="font-mono">{rec.expected_impact.customer_experience}</span>
                </div>
              </div>
            </DetailRow>

            <Separator />

            <DetailRow icon={Wrench} label="Effort">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {rec.effort}
              </Badge>
            </DetailRow>

            <Separator />

            <DetailRow icon={Clock} label="Valid Window">
              <span className="font-mono text-xs">
                {rec.valid_from} → {rec.valid_until}
              </span>
            </DetailRow>

            <DetailRow icon={ShieldCheck} label="Last Validated">
              <span className="font-mono text-xs">
                {new Date(rec.last_validated_at).toLocaleString()}
              </span>
            </DetailRow>

            {rec.superseded_by && (
              <>
                <Separator />
                <DetailRow icon={LinkIcon} label="Update Chain">
                  <div className="space-y-1 text-xs">
                    <p>Superseded by: <span className="font-mono">{rec.superseded_by}</span></p>
                    {rec.update_reason && (
                      <p className="text-muted-foreground">{rec.update_reason}</p>
                    )}
                  </div>
                </DetailRow>
              </>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-border">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleStatus("accepted")} className="bg-[var(--success)] hover:bg-[var(--success)]/80">
              <Check className="size-3.5" /> Accept
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleStatus("cancelled")}>
              <X className="size-3.5" /> Reject
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleStatus("active")}>
              <Pencil className="size-3.5" /> Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleStatus("completed")}>
              <CheckCircle2 className="size-3.5" /> Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleStatus("ignored")}>
              <EyeOff className="size-3.5" /> Ignore
            </Button>
          </div>
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
