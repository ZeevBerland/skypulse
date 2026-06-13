import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number): string {
  if (score > 70) return "text-[var(--revenue-green)]";
  if (score >= 40) return "text-[var(--warning)]";
  return "text-[var(--destructive)]";
}

function getStrokeColor(score: number): string {
  if (score > 70) return "#70F0A0";
  if (score >= 40) return "#FFB000";
  return "#FF4D6A";
}

const sizes = {
  sm: { width: 64, strokeWidth: 4, fontSize: "text-sm" },
  md: { width: 96, strokeWidth: 5, fontSize: "text-xl" },
  lg: { width: 128, strokeWidth: 6, fontSize: "text-3xl" },
};

export function ScoreGauge({
  score,
  maxScore = 100,
  label,
  size = "md",
}: ScoreGaugeProps) {
  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const strokeDashoffset = circumference * (1 - progress * 0.75);
  const strokeColor = getStrokeColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width, height: width * 0.75 }}>
        <svg
          width={width}
          height={width * 0.75}
          viewBox={`0 0 ${width} ${width * 0.75}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <circle
            cx={width / 2}
            cy={width * 0.7}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            className="text-[var(--border)] opacity-30"
            transform={`rotate(-225, ${width / 2}, ${width * 0.7})`}
          />
          {/* Progress arc */}
          <circle
            cx={width / 2}
            cy={width * 0.7}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-225, ${width / 2}, ${width * 0.7})`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span
            className={cn("font-mono font-bold", fontSize, getScoreColor(score))}
          >
            {score}
          </span>
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
