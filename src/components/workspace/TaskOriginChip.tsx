import { Target } from "lucide-react";
import { originChip, type OriginMaps } from "@/lib/task-origin";
import { cn } from "@/lib/utils";

export function TaskOriginChip({
  task,
  maps,
  className,
}: {
  task: {
    origin_type?: string | null;
    origin_note?: string | null;
    created_by?: string | null;
    related_event_id?: string | null;
  };
  maps?: OriginMaps | undefined;
  className?: string | undefined;
}) {
  const chip = originChip(task, maps);
  if (!chip) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
        chip.className,
        className,
      )}
      title={chip.label}
    >
      {chip.icon === "target" && <Target className="size-3 shrink-0" />}
      <span className="truncate">{chip.label}</span>
    </span>
  );
}
