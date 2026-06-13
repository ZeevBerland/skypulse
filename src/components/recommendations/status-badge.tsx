import { Badge } from "@/components/ui/badge";
import type { RecommendationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  RecommendationStatus,
  { label: string; className: string }
> = {
  suggested: {
    label: "Suggested",
    className: "bg-[#5FA8FF]/15 text-[#5FA8FF] border-[#5FA8FF]/30",
  },
  accepted: {
    label: "Accepted",
    className: "bg-[#70F0A0]/15 text-[#70F0A0] border-[#70F0A0]/30",
  },
  active: {
    label: "Active",
    className: "bg-[#00C8FF]/15 text-[#00C8FF] border-[#00C8FF]/30",
  },
  updated: {
    label: "Updated",
    className: "bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#FF4D6A]/15 text-[#FF4D6A] border-[#FF4D6A]/30",
  },
  completed: {
    label: "Completed",
    className: "bg-[#7E8BA3]/15 text-[#7E8BA3] border-[#7E8BA3]/30",
  },
  ignored: {
    label: "Ignored",
    className: "bg-[#7E8BA3]/10 text-[#7E8BA3] border-[#7E8BA3]/20",
  },
};

interface StatusBadgeProps {
  status: RecommendationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px]", config.className)}>
      {config.label}
    </Badge>
  );
}
