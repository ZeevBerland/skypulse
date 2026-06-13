import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  colorClass?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  colorClass,
  icon,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 h-[2px] w-full bg-[var(--signal-blue)]/40" />
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {icon && (
            <span className="text-muted-foreground/60">{icon}</span>
          )}
        </div>
        <div className="mt-2">
          <span
            className={cn(
              "font-mono text-3xl font-bold tracking-tight",
              colorClass ?? "text-white"
            )}
          >
            {value}
          </span>
        </div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            {subtitle && <span>{subtitle}</span>}
            {trend && (
              <span
                className={cn(
                  "font-mono text-[11px]",
                  trend.value > 0 && "text-[var(--revenue-green)]",
                  trend.value < 0 && "text-[var(--destructive)]"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
