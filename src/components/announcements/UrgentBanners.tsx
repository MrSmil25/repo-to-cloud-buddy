import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/hooks/useProfile";
import { fetchActiveAnnouncements, fetchMyReadIds, markAsRead } from "@/lib/announcements";

export function UrgentBanners() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: items = [] } = useQuery({
    queryKey: ["urgent-announcements"],
    queryFn: fetchActiveAnnouncements,
  });
  const { data: readIds = [] } = useQuery({
    queryKey: ["announcement-reads", profile?.id],
    queryFn: () => fetchMyReadIds(profile!.id),
    enabled: !!profile?.id,
  });

  const read = useMutation({
    mutationFn: (id: string) => markAsRead(id, profile!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-reads"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-read-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const urgent = items.filter(
    (i) => i.level === "Mendesak" && !readIds.includes(i.id) && !dismissed.includes(i.id),
  );

  if (urgent.length === 0) return null;

  return (
    <div className="space-y-3">
      {urgent.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-destructive/80">{item.body}</p>
            </div>
          </div>
          {item.requires_ack ? (
            <Button
              size="sm"
              variant="destructive"
              className="shrink-0"
              onClick={() => read.mutate(item.id)}
            >
              Saya sudah baca
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setDismissed((prev) => [...prev, item.id])}
            >
              <X className="size-4" /> Tutup
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
