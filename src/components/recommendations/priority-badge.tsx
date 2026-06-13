import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-[#FF4D6A]/15 text-[#FF4D6A] border-[#FF4D6A]/30",
  },
  high: {
    label: "High",
    className: "bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/30",
  },
  medium: {
    label: "Medium",
    className: "bg-[#00C8FF]/15 text-[#00C8FF] border-[#00C8FF]/30",
  },
  low: {
    label: "Low",
    className: "bg-[#7E8BA3]/15 text-[#7E8BA3] border-[#7E8BA3]/30",
  },
};

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px]", config.className)}>
      {config.label}
    </Badge>
  );
}
