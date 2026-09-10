import { useQuery } from "@tanstack/react-query";
import { Archive } from "lucide-react";
import { supabase } from "@/lib/supabase-external";
import { formatDateID } from "@/lib/format";
import type { ArchivedFields } from "@/lib/archive";

export function ArchivedInfoBanner({
  item,
  className = "",
}: {
  item?: ArchivedFields | null;
  className?: string | undefined;
}) {
  const archivedBy = item?.archived_by ?? null;
  const { data: name } = useQuery({
    queryKey: ["archiver-name", archivedBy],
    enabled: !!archivedBy,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", archivedBy as string)
        .maybeSingle();
      return data?.full_name ?? null;
    },
  });

  if (!item?.is_archived) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground ${className}`}
    >
      <Archive className="mt-0.5 size-3.5 shrink-0" />
      <p>
        Diarsipkan oleh {name ?? "—"}
        {item.archived_at ? ` pada ${formatDateID(item.archived_at)}` : ""}.
        {item.archive_reason ? ` Alasan: ${item.archive_reason}` : ""}
      </p>
    </div>
  );
}
