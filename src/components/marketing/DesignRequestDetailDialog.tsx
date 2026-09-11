import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  canRejectDesign,
  daysFromToday,
  isImageUrl,
  label,
  takeDesignRequest,
  updateDesignRequest,
  type DesignRequest,
} from "@/lib/marketing";
import { formatDateID } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArchivedInfoBanner } from "@/components/archive/ArchivedInfoBanner";
import { DesignStatusBadge, PriorityBadge, TypeBadge } from "./MarketingBadges";

export function DesignRequestDetailDialog({
  request,
  onOpenChange,
}: {
  request: DesignRequest | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();

  const [resultUrl, setResultUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setResultUrl(request?.result_url ?? "");
    setNotes("");
  }, [request?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameOf = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.full_name as string]));
    return (id?: string | null) => (id ? (map.get(id) ?? "-") : "-");
  }, [profiles]);

  const invalidate = () => {
    for (const key of [
      "design-requests",
      "design-workload",
      "content-designs",
      "content-plans",
      "event-design-requests",
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const act = useMutation({
    mutationFn: async (patch: Partial<DesignRequest>) => updateDesignRequest(request!.id, patch),
    onSuccess: () => {
      invalidate();
      toast.success("Permintaan diperbarui.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Gagal: " + e.message),
  });

  const take = useMutation({
    mutationFn: async () => takeDesignRequest(request!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Permintaan diambil. Selamat berkarya!");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Gagal mengambil: " + e.message),
  });

  if (!request) return null;

  const isDesigner = !!profile?.id && request.designer_id === profile.id;
  const isRequester = !!profile?.id && request.requested_by === profile.id;
  const canDecide = canRejectDesign(profile?.role, profile?.division);
  const sisa = daysFromToday(request.needed_by);

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            <span className={request.is_archived ? "line-through opacity-60" : ""}>{request.title}</span>
            <DesignStatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <TypeBadge value={request.design_type} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {request.is_archived && <ArchivedInfoBanner item={request} />}

          <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-xs sm:grid-cols-2">
            <p>Peminta: <b>{nameOf(request.requested_by)}</b> ({request.requester_division ?? "-"})</p>
            <p>Desainer: <b>{nameOf(request.designer_id)}</b></p>
            <p>
              Dibutuhkan: <b>{formatDateID(request.needed_by)}</b>
              {sisa !== null && (
                <span className={sisa < 0 ? " font-semibold text-destructive" : " text-muted-foreground"}>
                  {sisa < 0 ? ` · telat ${Math.abs(sisa)} hari` : ` · sisa ${sisa} hari`}
                </span>
              )}
            </p>
            <p>Revisi ke: <b>{request.revision_count ?? 0}</b></p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Brief</p>
            <p className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-sm">{request.brief}</p>
          </div>

          {request.reference_notes && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Referensi</p>
              <p className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-sm">
                {request.reference_notes}
              </p>
            </div>
          )}

          {request.revision_notes && (
            <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
              Catatan revisi: {request.revision_notes}
            </p>
          )}
          {request.reject_reason && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              Alasan ditolak: {request.reject_reason}
            </p>
          )}

          {request.result_url && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Hasil Desain</p>
              {isImageUrl(request.result_url) ? (
                <img
                  src={request.result_url}
                  alt={`Hasil desain ${request.title}`}
                  loading="lazy"
                  className="max-h-64 rounded-lg border object-contain"
                />
              ) : (
                <a
                  className="text-sm text-primary underline"
                  href={request.result_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka hasil desain
                </a>
              )}
            </div>
          )}

          {/* Aksi desainer */}
          {!request.designer_id && request.status === "Baru" && !request.is_archived && (
            <Button onClick={() => take.mutate()} disabled={take.isPending}>
              Ambil Permintaan Ini
            </Button>
          )}

          {isDesigner && !request.is_archived && (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-xs font-semibold">Aksi Desainer</p>
              {(request.status === "Diambil" || request.status === "Revisi") && (
                <Button size="sm" onClick={() => act.mutate({ status: "Dikerjakan" })}>
                  Mulai Kerjakan
                </Button>
              )}
              {(request.status === "Dikerjakan" || request.status === "Revisi") && (
                <div className="space-y-2">
                  <Label htmlFor="dr-result">Link Hasil Desain</Label>
                  <Input
                    id="dr-result"
                    value={resultUrl}
                    onChange={(e) => setResultUrl(e.target.value)}
                    placeholder="https://drive.google.com/…"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!resultUrl.trim()) {
                        toast.error("Isi link hasil desain dulu.");
                        return;
                      }
                      act.mutate({
                        status: "Review",
                        result_url: resultUrl.trim(),
                        submitted_at: new Date().toISOString(),
                      });
                    }}
                  >
                    Kirim untuk Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Aksi peminta / kadiv */}
          {(isRequester || canDecide) && request.status === "Review" && !request.is_archived && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-semibold">Review Hasil</p>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan revisi (kalau perlu diperbaiki)"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    act.mutate({ status: "Selesai", completed_at: new Date().toISOString() })
                  }
                >
                  Terima & Selesai
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!notes.trim()) {
                      toast.error("Tulis catatan revisinya dulu.");
                      return;
                    }
                    act.mutate({
                      status: "Revisi",
                      revision_notes: notes.trim(),
                      revision_count: (request.revision_count ?? 0) + 1,
                    });
                  }}
                >
                  Minta Revisi
                </Button>
              </div>
            </div>
          )}

          {canDecide && request.status === "Baru" && !request.is_archived && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="dr-reject" className="text-xs font-semibold">Tolak Permintaan</Label>
              <Textarea
                id="dr-reject"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alasan penolakan"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!notes.trim()) {
                    toast.error("Tulis alasan penolakan.");
                    return;
                  }
                  act.mutate({ status: "Ditolak", reject_reason: notes.trim() });
                }}
              >
                Tolak
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
