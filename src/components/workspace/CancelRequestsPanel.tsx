import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { decideCancelRequest, fetchCancelRequests } from "@/lib/cancel-requests";
import { formatRemaining, isUrgent } from "@/lib/countdown";
import { formatDateID } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OriginMaps } from "@/lib/task-origin";

export function CancelRequestsPanel({ maps }: { maps?: OriginMaps | undefined }) {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const { data = [], isLoading } = useQuery({
    queryKey: ["cancel-requests"],
    queryFn: fetchCancelRequests,
  });
  const pending = data.filter((r) => r.status === "Pending");

  const decide = useMutation({
    mutationFn: ({ id, approve, response }: { id: string; approve: boolean; response?: string }) =>
      decideCancelRequest(id, approve, response),
    onSuccess: () => {
      toast.success("Keputusan tersimpan.");
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["cancel-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyimpan keputusan."),
  });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl" />;

  if (pending.length === 0)
    return (
      <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Tidak ada permintaan pembatalan yang menunggu keputusanmu.
      </p>
    );

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Task</th>
              <th className="px-4 py-3 font-semibold">Pemohon</th>
              <th className="px-4 py-3 font-semibold">Alasan</th>
              <th className="px-4 py-3 font-semibold">Diajukan</th>
              <th className="px-4 py-3 font-semibold">Sisa Waktu</th>
              <th className="px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-4 py-3 font-medium">{r.tasks?.title ?? "Task"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {maps?.people[r.requested_by]?.full_name ?? "Anggota"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateID(r.created_at)}</td>
                <td
                  className={`px-4 py-3 ${isUrgent(r.expires_at) ? "font-semibold text-red-600" : "text-muted-foreground"}`}
                >
                  {formatRemaining(r.expires_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: r.id, approve: true })}
                    >
                      Setujui
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectId(r.id)}>
                      Tolak
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak permintaan pembatalan</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Jelaskan alasan penolakan supaya pemohon paham."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Batal
            </Button>
            <Button
              disabled={rejectReason.trim().length < 5 || decide.isPending}
              onClick={() =>
                rejectId &&
                decide.mutate({ id: rejectId, approve: false, response: rejectReason.trim() })
              }
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function usePendingCancelCount() {
  const { data = [] } = useQuery({ queryKey: ["cancel-requests"], queryFn: fetchCancelRequests });
  return data.filter((r) => r.status === "Pending").length;
}
