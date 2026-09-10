import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchReaders, type Announcement } from "@/lib/announcements";
import { useProfiles } from "@/hooks/useProfile";
import { relativeTime } from "@/lib/format";

export function ReadStatusDialog({
  item,
  onOpenChange,
}: {
  item: Announcement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: profiles = [] } = useProfiles();
  const { data: readers = [], isLoading } = useQuery({
    queryKey: ["announcement-readers", item?.id],
    queryFn: () => fetchReaders(item!.id),
    enabled: !!item,
  });

  const target = profiles.filter(
    (p) =>
      p.status === "Active" &&
      (item?.scope === "Organisasi" || p.division === item?.target_division),
  );
  const readMap = new Map(readers.map((r) => [r.reader_id, r.read_at]));
  const sudah = target.filter((p) => readMap.has(p.id));
  const belum = target.filter((p) => !readMap.has(p.id));

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Status Baca</DialogTitle>
          <DialogDescription>{item?.title}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : (
          <div className="space-y-5">
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="size-4" /> Sudah baca ({sudah.length})
              </h4>
              <ul className="space-y-1 text-sm">
                {sudah.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 rounded-lg bg-muted px-3 py-2">
                    <span>{p.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(readMap.get(p.id) ?? null)}
                    </span>
                  </li>
                ))}
                {sudah.length === 0 && (
                  <li className="text-sm text-muted-foreground">Belum ada yang konfirmasi.</li>
                )}
              </ul>
            </section>
            <section>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                <Clock className="size-4" /> Belum baca ({belum.length})
              </h4>
              <ul className="space-y-1 text-sm">
                {belum.map((p) => (
                  <li key={p.id} className="rounded-lg bg-muted px-3 py-2">
                    {p.full_name}
                    {p.phone ? (
                      <span className="ml-2 text-xs text-muted-foreground">{p.phone}</span>
                    ) : null}
                  </li>
                ))}
                {belum.length === 0 && (
                  <li className="text-sm text-muted-foreground">Semua sudah baca 🎉</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
