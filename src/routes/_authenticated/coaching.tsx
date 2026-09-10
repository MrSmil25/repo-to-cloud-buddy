import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { CoachingFormDialog, type CoachingFormValue } from "@/components/hr/CoachingFormDialog";
import { useMyProfile, useProfiles, isBPH } from "@/hooks/useProfile";
import {
  acknowledgeCoachingNote,
  createCoachingNote,
  fetchCoachingNotes,
  isBPHOrSupervisor,
  isKadiv,
  COACHING_TOPIC_LABEL,
} from "@/lib/hr";
import { formatDateID } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/coaching")({
  head: () => ({
    meta: [
      { title: "Catatan Bimbingan — OrgTool" },
      { name: "description", content: "Rekam jejak sesi bimbingan antara pengurus dan anggota." },
      { property: "og:title", content: "Catatan Bimbingan — OrgTool" },
      {
        property: "og:description",
        content: "Rekam jejak sesi bimbingan antara pengurus dan anggota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachingPage,
});

function CoachingPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const [open, setOpen] = useState(false);

  const bph = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);
  const kadiv = isKadiv(profile?.role);
  const canCreate = bph || kadiv;

  const candidates = useMemo(() => {
    if (!profile) return [];
    const pool = bph ? profiles : profiles.filter((p) => p.division === profile.division);
    return pool.filter((p) => p.id !== profile.id);
  }, [profiles, profile, bph]);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["coaching-notes"],
    queryFn: () => fetchCoachingNotes(),
  });

  const createMutation = useMutation({
    mutationFn: (v: CoachingFormValue) =>
      createCoachingNote({ ...v, coach_id: profile!.id }),
    onSuccess: () => {
      toast.success("Catatan bimbingan tersimpan.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["coaching-notes"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyimpan catatan."),
  });

  const ackMutation = useMutation({
    mutationFn: acknowledgeCoachingNote,
    onSuccess: () => {
      toast.success("Ditandai sudah dibaca.");
      queryClient.invalidateQueries({ queryKey: ["coaching-notes"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-unread"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menandai catatan."),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catatan Bimbingan</h1>
          <p className="text-sm text-muted-foreground">
            Ruang percakapan yang tercatat, bukan daftar kesalahan.
          </p>
        </div>
        {canCreate && <Button onClick={() => setOpen(true)}>Catat Sesi</Button>}
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada catatan bimbingan.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const mine = n.member_id === profile?.id;
            return (
              <article key={n.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    path={n.member?.photo_url}
                    name={n.member?.full_name}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{n.member?.full_name ?? "Anggota"}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                        {COACHING_TOPIC_LABEL[n.topic] ?? n.topic}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateID(n.created_at)} · oleh {n.coach?.full_name ?? "—"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{n.discussion}</p>
                    {n.agreements && (
                      <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted px-3 py-2 text-sm">
                        Kesepakatan: {n.agreements}
                      </p>
                    )}
                    {n.next_checkin && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Check-in berikutnya: {formatDateID(n.next_checkin)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      {n.member_acknowledged ? (
                        <span className="text-xs font-medium text-emerald-600">
                          Sudah dibaca anggota
                          {n.acknowledged_at ? ` · ${formatDateID(n.acknowledged_at)}` : ""}
                        </span>
                      ) : mine ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ackMutation.isPending}
                          onClick={() => ackMutation.mutate(n.id)}
                        >
                          Tandai sudah dibaca
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Menunggu dibaca anggota
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CoachingFormDialog
        open={open}
        onOpenChange={setOpen}
        submitting={createMutation.isPending}
        candidates={candidates}
        onSubmit={(v) => createMutation.mutate(v)}
      />
    </div>
  );
}
