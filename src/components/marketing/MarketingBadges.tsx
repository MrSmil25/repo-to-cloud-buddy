import {
  CONTENT_STATUS_META,
  DESIGN_STATUS_META,
  PRIORITY_META,
  PLATFORM_SHORT,
  label,
  type ContentPillar,
} from "@/lib/marketing";

export function ContentStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const meta = CONTENT_STATUS_META[status] ?? { label: label(status), className: "" };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}

export function DesignStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const meta = DESIGN_STATUS_META[status] ?? { label: label(status), className: "" };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] ?? { label: priority, className: "" };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function TypeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
      {label(value)}
    </span>
  );
}

export function PlatformChip({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
      {PLATFORM_SHORT[platform] ?? platform}
    </span>
  );
}

export function PillarDot({ pillar }: { pillar?: ContentPillar | null }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: pillar?.color_hex ?? "transparent" }}
      title={pillar?.name ?? "Tanpa pilar"}
    />
  );
}

export function initialsOf(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PersonChip({ name }: { name?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-primary">
        {initialsOf(name)}
      </span>
      {name ?? "-"}
    </span>
  );
}
