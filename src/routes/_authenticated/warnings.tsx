import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WarningCard } from "@/components/hr/WarningCard";
import { WarningFormDialog } from "@/components/hr/WarningFormDialog";
import { useMyProfile, useProfiles, isBPH } from "@/hooks/useProfile";
import { isBPHOrSupervisor, isKadiv } from "@/lib/hr";
import {
  acknowledgeWarning,
  fetchWarnings,
  issueWarning,
  revokeWarning,
  saveMemberResponse,
  type NewWarningInput,
  type WarningRow,
} from "@/lib/warnings";

export const Route = createFileRoute("/_authenticated/warnings")({
  head: () => ({
    meta: [
      { title: "Peringatan (SP) — OrgTool" },
      {
        name: "description",
        content: "Catatan peringatan resmi organisasi, lengkap dengan bukti dan tanggapan anggota.",
      },
      { property: "og:title", content: "Peringatan (SP) — OrgTool" },
      {
        property: "og:description",
        content: "Catatan peringatan resmi organisasi, lengkap dengan bukti dan tanggapan anggota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WarningsPage,
});

function WarningsPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const bph = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);
  const kadiv = isKadiv(profile?.role);
  const canIssue = bph || kadiv;
  const canRevokeAll =
    profile?.role === "Ketua" || profile?.role === "Waketu" || profile?.role === "Supervisor";

  const all = useQuery({
    queryKey: ["warnings", "all"],
    queryFn: () => fetchWarnings(),
  });

  const rows = all.data ?? [];

  const mine = rows.filter((w) => w.member_id === profile?.id);
  const issued = rows.filter((w) => w.issued_by === profile?.id);
  const division = rows.filter(
    (w) => profile?.division && w.member?.division === profile.division,
  );

  const candidates = useMemo(() => {
    if (!profile) return [];
    if (bph) return profiles.filter((p) => p.id !== profile.id);
    if (kadiv)
      return profiles.filter((p) => p.division === profile.division && p.role === "Anggota");
    return [];
  }, [profiles, profile, bph, kadiv]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["warnings"] });
    qc.invalidateQueries({ queryKey: ["warnings-unack"] });
  }

  function fail(e: unknown) {
    toast.error(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
  }

  const issueMut = useMutation({
    mutationFn: (v: NewWarningInput) => issueWarning(v, profile!.id),
    onSuccess: () => {
      toast.success("Peringatan resmi diterbitkan.");
      setOpen(false);
      refresh();
    },
    onError: fail,
  });

  const ackMut = useMutation({
    mutationFn: (id: string) => acknowledgeWarning(id),
    onSuccess: () => {
      toast.success("Ditandai sudah dibaca.");
      refresh();
    },
    onError: fail,
  });

  const respMut = useMutation({
    mutationFn: (v: { id: string; response: string }) => saveMemberResponse(v.id, v.response),
    onSuccess: () => {
      toast.success("Tanggapan tersimpan.");
      refresh();
    },
    onError: fail,
  });

  const revokeMut = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      revokeWarning(v.id, profile!.id, v.reason),
    onSuccess: () => {
      toast.success("Peringatan dicabut. Riwayatnya tetap tersimpan.");
      refresh();
    },
    onError: fail,
  });

  const busy =
    ackMut.isPending || respMut.isPending || revokeMut.isPending || issueMut.isPending;

  function renderList(list: WarningRow[], emptyText: string) {
    if (all.isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
    if (list.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    return (
      <div className="space-y-4">
        {list.map((w) => (
          <WarningCard
            key={w.id}
            warning={w}
            isMine={w.member_id === profile?.id}
            canRevoke={canRevokeAll || w.issued_by === profile?.id}
            busy={busy}
            onAcknowledge={(id) => ackMut.mutate(id)}
            onSaveResponse={(id, response) => respMut.mutate({ id, response })}
            onRevoke={(id, reason) => revokeMut.mutate({ id, reason })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Peringatan (SP)</h1>
          <p className="text-sm text-muted-foreground">
            Catatan tindakan formal. Setiap peringatan wajib berbukti dan bisa ditanggapi.
          </p>
        </div>
        {canIssue && (
          <Button onClick={() => setOpen(true)}>+ Terbitkan Peringatan</Button>
        )}
      </header>

      <Tabs defaultValue="saya">
        <TabsList className="flex-wrap">
          <TabsTrigger value="saya">Untuk Saya</TabsTrigger>
          <TabsTrigger value="terbit">Yang Saya Terbitkan</TabsTrigger>
          {kadiv && <TabsTrigger value="divisi">Divisi Saya</TabsTrigger>}
          {bph && <TabsTrigger value="semua">Semua</TabsTrigger>}
        </TabsList>

        <TabsContent value="saya" className="mt-4">
          {renderList(mine, "Tidak ada peringatan untukmu. Terus jaga ritmenya.")}
        </TabsContent>
        <TabsContent value="terbit" className="mt-4">
          {renderList(issued, "Kamu belum pernah menerbitkan peringatan.")}
        </TabsContent>
        {kadiv && (
          <TabsContent value="divisi" className="mt-4">
            {renderList(division, "Tidak ada peringatan di divisimu.")}
          </TabsContent>
        )}
        {bph && (
          <TabsContent value="semua" className="mt-4">
            {renderList(rows, "Belum ada catatan peringatan.")}
          </TabsContent>
        )}
      </Tabs>

      {canIssue && (
        <WarningFormDialog
          open={open}
          onOpenChange={setOpen}
          candidates={candidates}
          submitting={issueMut.isPending}
          onSubmit={(v) => issueMut.mutate(v)}
        />
      )}
    </div>
  );
}
