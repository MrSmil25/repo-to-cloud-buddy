import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Palette, Plus } from "lucide-react";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import { formatDateID } from "@/lib/format";
import {
  DESIGN_BOARD_STATUSES,
  DESIGN_TYPES,
  PRIORITIES,
  daysFromToday,
  fetchDesignRequests,
  fetchDesignWorkload,
  label,
  type DesignRequest,
} from "@/lib/marketing";
import { DesignRequestWizard } from "@/components/marketing/DesignRequestWizard";
import { DesignRequestDetailDialog } from "@/components/marketing/DesignRequestDetailDialog";
import {
  DesignStatusBadge,
  PersonChip,
  PriorityBadge,
  TypeBadge,
} from "@/components/marketing/MarketingBadges";
import { ArchiveToggle } from "@/components/archive/ArchiveToggle";
import { ArchiveMenu } from "@/components/archive/ArchiveMenu";
import { ArchivedBadge } from "@/components/archive/ArchivedBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/design-queue")({
  head: () => ({
    meta: [
      { title: "Antrean Desain — OrgTool" },
      {
        name: "description",
        content:
          "Antrean permintaan desain organisasi: minta desain, ambil pekerjaan, kirim hasil, dan pantau beban desainer.",
      },
      { property: "og:title", content: "Antrean Desain — OrgTool" },
      {
        property: "og:description",
        content: "Antrean permintaan desain organisasi dan beban kerja tim desain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesignQueuePage,
});

const ALL = "__all__";

function RequestCard({
  request,
  nameOf,
  onOpen,
}: {
  request: DesignRequest;
  nameOf: (id?: string | null) => string;
  onOpen: () => void;
}) {
  const sisa = daysFromToday(request.needed_by);
  const late = sisa !== null && sisa < 0 && request.status !== "Selesai";
  return (
    <div
      className={`space-y-2 rounded-xl border bg-card p-3 shadow-sm ${
        request.is_archived ? "opacity-50" : ""
      } ${late ? "border-destructive/50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className={`min-w-0 flex-1 text-left text-sm font-semibold leading-snug ${
            request.is_archived ? "line-through opacity-60" : ""
          }`}
        >
          {request.title}
        </button>
        <ArchiveMenu
          table="design_requests"
          recordId={request.id}
          recordName={request.title}
          isArchived={request.is_archived}
          itemDivision={request.requester_division}
          invalidateKeys={["design-requests"]}
        />
      </div>
      {request.is_archived && <ArchivedBadge />}
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={request.priority} />
        <TypeBadge value={request.design_type} />
      </div>
      <p className={`text-[11px] ${late ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
        Butuh {formatDateID(request.needed_by)}
        {sisa !== null && (sisa < 0 ? ` · telat ${Math.abs(sisa)} hari` : ` · sisa ${sisa} hari`)}
      </p>
      <div className="flex items-center justify-between">
        <PersonChip name={nameOf(request.requested_by)} />
        {request.designer_id && (
          <span className="text-[10px] text-muted-foreground">→ {nameOf(request.designer_id)}</span>
        )}
      </div>
    </div>
  );
}

function DesignQueuePage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [view, setView] = useState<"papan" | "daftar">("papan");
  const [scope, setScope] = useState<"semua" | "saya" | "permintaanku">("semua");
  const [type, setType] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detail, setDetail] = useState<DesignRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["design-requests", includeArchived],
    queryFn: () => fetchDesignRequests(includeArchived),
  });
  const { data: workload = [] } = useQuery({
    queryKey: ["design-workload"],
    queryFn: fetchDesignWorkload,
  });

  const nameOf = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.full_name as string]));
    return (id?: string | null) => (id ? (map.get(id) ?? "-") : "-");
  }, [profiles]);

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (type !== ALL && r.design_type !== type) return false;
        if (priority !== ALL && r.priority !== priority) return false;
        if (scope === "saya" && r.designer_id !== profile?.id) return false;
        if (scope === "permintaanku" && r.requested_by !== profile?.id) return false;
        return true;
      }),
    [requests, type, priority, scope, profile?.id],
  );

  const rejected = filtered.filter((r) => r.status === "Ditolak");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Antrean Desain</h1>
          <p className="text-sm text-muted-foreground">
            Semua permintaan desain organisasi dalam satu antrean.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ArchiveToggle
            id="design-archive"
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
          />
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="size-4" /> Minta Desain
          </Button>
        </div>
      </header>

      {/* Beban kerja desainer */}
      {workload.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workload.map((w) => (
            <div key={w.designer_id ?? w.full_name} className="rounded-xl border bg-card p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Palette className="size-4 text-primary" /> {w.full_name ?? "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sedang dikerjakan: <b>{w.sedang_dikerjakan ?? 0}</b> · Selesai:{" "}
                <b>{w.total_selesai ?? 0}</b>
              </p>
              {(w.lewat_tenggat ?? 0) > 0 && (
                <p className="mt-1 text-xs font-semibold text-destructive">
                  {w.lewat_tenggat} lewat tenggat
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {(["papan", "daftar"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${
                view === v ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua permintaan</SelectItem>
            <SelectItem value="saya">Tugas desain saya</SelectItem>
            <SelectItem value="permintaanku">Permintaan saya</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Jenis" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Jenis</SelectItem>
            {DESIGN_TYPES.map((t) => (<SelectItem key={t} value={t}>{label(t)}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Prioritas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Prioritas</SelectItem>
            {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat antrean…</p>}

      {view === "papan" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DESIGN_BOARD_STATUSES.map((s) => {
            const items = filtered.filter((r) => r.status === s);
            return (
              <div key={s} className="flex w-64 shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label(s)}
                  </p>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex min-h-40 flex-1 flex-col gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-2">
                  {items.map((r) => (
                    <RequestCard key={r.id} request={r} nameOf={nameOf} onOpen={() => setDetail(r)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="space-y-1">
              <RequestCard request={r} nameOf={nameOf} onOpen={() => setDetail(r)} />
              <DesignStatusBadge status={r.status} className="ml-1" />
            </div>
          ))}
          {filtered.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Belum ada permintaan desain.</p>
          )}
        </div>
      )}

      {rejected.length > 0 && view === "papan" && (
        <div className="rounded-xl border bg-card p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Ditolak ({rejected.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rejected.map((r) => (
              <RequestCard key={r.id} request={r} nameOf={nameOf} onOpen={() => setDetail(r)} />
            ))}
          </div>
        </div>
      )}

      <DesignRequestWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <DesignRequestDetailDialog request={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}
