import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalCard } from "@/components/hr/ProposalCard";
import { ProposalFormDialog } from "@/components/hr/ProposalFormDialog";
import { useMyProfile, useProfiles, isBPH } from "@/hooks/useProfile";
import { isBPHOrSupervisor } from "@/lib/hr";
import {
  cancelProposal,
  createProposal,
  fetchProposals,
  type NewProposalInput,
  type ProposalRow,
} from "@/lib/proposals";

export const Route = createFileRoute("/_authenticated/warnings_/proposals/")({
  head: () => ({
    meta: [
      { title: "Usulan Peringatan — OrgTool" },
      {
        name: "description",
        content:
          "Usulan peringatan resmi yang diputuskan bersama lewat pemungutan suara anonim.",
      },
      { property: "og:title", content: "Usulan Peringatan — OrgTool" },
      {
        property: "og:description",
        content:
          "Usulan peringatan resmi yang diputuskan bersama lewat pemungutan suara anonim.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProposalsPage,
});

function ProposalsPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ProposalRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const canCancel = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);

  const list = useQuery({ queryKey: ["proposals"], queryFn: fetchProposals });
  const rows = list.data ?? [];

  const active = rows.filter((p) => p.status === "Voting");
  const mine = rows.filter((p) => p.target_member_id === profile?.id);
  const proposed = rows.filter((p) => p.proposed_by === profile?.id);
  const history = rows.filter((p) => p.status !== "Voting");

  function refresh() {
    qc.invalidateQueries({ queryKey: ["proposals"] });
    qc.invalidateQueries({ queryKey: ["proposal-summary"] });
  }

  function fail(e: unknown) {
    toast.error(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
  }

  const createMut = useMutation({
    mutationFn: (v: NewProposalInput) => createProposal(v, profile!.id),
    onSuccess: () => {
      toast.success("Usulan terkirim. Pemilih dalam ruang lingkup sudah dinotifikasi.");
      setOpen(false);
      refresh();
    },
    onError: fail,
  });

  const cancelMut = useMutation({
    mutationFn: (v: { id: string; reason: string }) => cancelProposal(v.id, v.reason),
    onSuccess: () => {
      toast.success("Usulan dibatalkan. Riwayatnya tetap tersimpan.");
      setCancelTarget(null);
      setCancelReason("");
      refresh();
    },
    onError: fail,
  });

  function renderList(items: ProposalRow[], empty: string) {
    if (list.isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
    if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
    return items.map((p) => (
      <ProposalCard key={p.id} proposal={p} canCancel={canCancel} onCancel={setCancelTarget} />
    ));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usulan Peringatan</h1>
          <p className="text-sm text-muted-foreground">
            Tindakan formal untuk pengurus, diputuskan bersama lewat pemungutan suara anonim.
          </p>
        </div>
        {profile?.status === "Active" && (
          <Button onClick={() => setOpen(true)}>+ Ajukan Usulan SP</Button>
        )}
      </header>

      <Tabs defaultValue="aktif">
        <TabsList className="flex-wrap">
          <TabsTrigger value="aktif">Aktif</TabsTrigger>
          {mine.length > 0 && <TabsTrigger value="saya">Untuk Saya</TabsTrigger>}
          <TabsTrigger value="ajukan">Yang Saya Ajukan</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="aktif" className="mt-4 space-y-3">
          {renderList(active, "Tidak ada usulan yang sedang berjalan.")}
        </TabsContent>
        <TabsContent value="saya" className="mt-4 space-y-3">
          {renderList(mine, "Tidak ada usulan yang menyangkut kamu.")}
        </TabsContent>
        <TabsContent value="ajukan" className="mt-4 space-y-3">
          {renderList(proposed, "Kamu belum pernah mengajukan usulan.")}
        </TabsContent>
        <TabsContent value="riwayat" className="mt-4 space-y-3">
          {renderList(history, "Belum ada usulan yang selesai.")}
        </TabsContent>
      </Tabs>

      {profile && (
        <ProposalFormDialog
          open={open}
          onOpenChange={setOpen}
          profiles={profiles}
          me={profile}
          submitting={createMut.isPending}
          onSubmit={(v) => createMut.mutate(v)}
        />
      )}

      <Dialog open={!!cancelTarget} onOpenChange={(v) => !v && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan usulan</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Alasan pembatalan (tercatat dalam riwayat)"
          />
          <Button
            disabled={cancelReason.trim().length < 5 || cancelMut.isPending}
            onClick={() =>
              cancelTarget &&
              cancelMut.mutate({ id: cancelTarget.id, reason: cancelReason.trim() })
            }
          >
            Batalkan usulan
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
