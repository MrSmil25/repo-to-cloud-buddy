type Props = {
  value: number;
  size?: number;
  stroke?: number;
  colorClass?: string;
  label?: string;
};

export function ProgressRing({
  value,
  size = 96,
  stroke = 9,
  colorClass = "text-primary",
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className={`${colorClass} transition-all`}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute text-lg font-bold">{label ?? `${clamped}%`}</span>
    </div>
  );
}

export function MiniBar({ value, colorClass = "bg-primary" }: { value: number; colorClass?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function healthColor(percent: number) {
  if (percent < 40) return { text: "text-destructive", bar: "bg-destructive" };
  if (percent < 70) return { text: "text-amber-500", bar: "bg-amber-500" };
  return { text: "text-emerald-600", bar: "bg-emerald-600" };
}
