import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-external";
import { isBPH, isSupervisor, useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import { isKadiv } from "@/lib/hr";
import {
  approveHelpRequest,
  cancelMyHelpRequest,
  createHelpRequest,
  fetchHelpRequests,
  rejectHelpRequest,
  type HelpRequest,
  type NewHelpRequest,
} from "@/lib/help-requests";
import { fetchEvents } from "@/lib/events";
import { HelpRequestCard } from "@/components/help-requests/HelpRequestCard";
import { HelpRequestWizard } from "@/components/help-requests/HelpRequestWizard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/help-requests")({
  head: () => ({
    meta: [
      { title: "Request Bantuan — OrgTool" },
      {
        name: "description",
        content: "Ajukan bantuan ke divisi lain dan putuskan request yang masuk ke divisimu.",
      },
      { property: "og:title", content: "Request Bantuan — OrgTool" },
      {
        property: "og:description",
        content: "Ajukan bantuan ke divisi lain dan putuskan request yang masuk ke divisimu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpRequestsPage,
});

type TabKey = "mine" | "division" | "history";

function HelpRequestsPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("mine");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<HelpRequest | null>(null);
  const [approveAssignee, setApproveAssignee] = useState("");
  const [rejectTarget, setRejectTarget] = useState<HelpRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [, setTick] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["help-requests"],
    queryFn: fetchHelpRequests,
  });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const canDecide = isKadiv(profile?.role) || isBPH(profile?.role) || isSupervisor(profile?.role);
  const isBph = isBPH(profile?.role) || isSupervisor(profile?.role);

  const nameOf = (id: string | null) =>
    profiles.find((p) => p.id === id)?.full_name ?? "Anggota";
  const divisionName = (code: string | null) =>
    divisions.find((d) => d.code === code)?.name ?? code ?? "-";

  const mine = requests.filter((r) => r.requested_by === userId);
  const forMyDivision = requests.filter(
    (r) =>
      r.status === "Pending" &&
      (isBph || r.target_division === profile?.division) &&
      r.requested_by !== userId,
  );
  const history = requests.filter((r) => r.status !== "Pending");

  const visible = useMemo(() => {
    if (tab === "mine") return mine;
    if (tab === "division") return forMyDivision;
    return history;
  }, [tab, mine, forMyDivision, history]);

  const createMutation = useMutation({
    mutationFn: (input: NewHelpRequest) => createHelpRequest(input, profile?.division ?? null),
    onSuccess: () => {
      toast.success("Request terkirim. Kadiv divisi tujuan akan memutuskan.");
      setWizardOpen(false);
      queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal mengirim request."),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string | null }) =>
      approveHelpRequest(id, assignee),
    onSuccess: () => {
      toast.success("Request disetujui. Task otomatis dibuat.");
      setApproveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyetujui request."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectHelpRequest(id, reason),
    onSuccess: () => {
      toast.success("Request ditolak.");
      setRejectTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menolak request."),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelMyHelpRequest(id),
    onSuccess: () => {
      toast.success("Request dibatalkan.");
      queryClient.invalidateQueries({ queryKey: ["help-requests"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal membatalkan request."),
  });

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "mine", label: "Saya Ajukan" },
    ...(canDecide
      ? [{ key: "division" as TabKey, label: "Untuk Divisi Saya", badge: forMyDivision.length }]
      : []),
    { key: "history", label: "Riwayat" },
  ];

  const approveCandidates = profiles.filter(
    (p) => p.division === approveTarget?.target_division,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request Bantuan</h1>
          <p className="text-sm text-muted-foreground">
            Butuh bantuan divisi lain? Ajukan di sini, Kadiv tujuan yang memutuskan.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="size-4" /> Ajukan Request Bantuan
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {t.label}
            {!!t.badge && t.badge > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Belum ada request di sini.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <HelpRequestCard
              key={r.id}
              request={r}
              requesterName={nameOf(r.requested_by)}
              divisionName={divisionName}
              canDecide={canDecide && r.requested_by !== userId}
              isMine={r.requested_by === userId}
              onApprove={() => {
                setApproveTarget(r);
                setApproveAssignee(r.suggested_assignee_id ?? "");
              }}
              onReject={() => {
                setRejectTarget(r);
                setRejectReason("");
              }}
              onCancel={() => cancelMutation.mutate(r.id)}
            />
          ))}
        </div>
      )}

      <HelpRequestWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        divisions={divisions.map((d) => ({ code: d.code, name: d.name }))}
        members={profiles.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          role: p.role,
          division: p.division,
        }))}
        events={events.map((e) => ({ id: e.id, label: e.name }))}
        myDivision={profile?.division ?? null}
        submitting={createMutation.isPending}
        onSubmit={(input) => createMutation.mutate(input)}
      />

      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui request bantuan</DialogTitle>
            <DialogDescription>{approveTarget?.task_title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pelaksana (bisa ganti dari usulan)</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={approveAssignee}
              onChange={(e) => setApproveAssignee(e.target.value)}
            >
              <option value="">Belum ditentukan</option>
              {approveCandidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.role}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              Batal
            </Button>
            <Button
              disabled={approveMutation.isPending}
              onClick={() =>
                approveTarget &&
                approveMutation.mutate({
                  id: approveTarget.id,
                  assignee: approveAssignee || null,
                })
              }
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak request bantuan</DialogTitle>
            <DialogDescription>{rejectTarget?.task_title}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Jelaskan alasannya biar pemohon paham."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Batal
            </Button>
            <Button
              disabled={rejectReason.trim().length < 5 || rejectMutation.isPending}
              onClick={() =>
                rejectTarget &&
                rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })
              }
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
