import { EVENT_STATUS_META, EVENT_TYPE_META } from "@/lib/events";
import { Badge } from "@/components/ui/badge";

export function EventStatusBadge({ status }: { status?: string | null }) {
  const meta = EVENT_STATUS_META[status ?? ""] ?? { label: status ?? "-", className: "", pulse: false };
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.pulse && <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-green-600" />}
      {meta.label}
    </Badge>
  );
}

export function EventTypeBadge({ type }: { type?: string | null }) {
  const meta = EVENT_TYPE_META[type ?? ""] ?? { label: type ?? "-", className: "" };
  return <Badge variant="outline" className={meta.className}>{meta.label}</Badge>;
}
