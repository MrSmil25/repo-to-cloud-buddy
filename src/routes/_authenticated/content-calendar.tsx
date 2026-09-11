import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutList, Plus, Trello } from "lucide-react";
import { toast } from "sonner";
import { useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import { fetchEvents } from "@/lib/events";
import { formatDateID } from "@/lib/format";
import {
  CONTENT_BOARD_STATUSES,
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  canManageContent,
  fetchContentPlans,
  fetchPillars,
  label,
  toDateKey,
  updateContentPlan,
  type ContentPlan,
  type ContentStatus,
} from "@/lib/marketing";
import { ContentFormDialog } from "@/components/marketing/ContentFormDialog";
import { ContentDetailDialog } from "@/components/marketing/ContentDetailDialog";
import {
  ContentStatusBadge,
  PillarDot,
  PlatformChip,
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

export const Route = createFileRoute("/_authenticated/content-calendar")({
  head: () => ({
    meta: [
      { title: "Kalender Konten — OrgTool" },
      {
        name: "description",
        content:
          "Rencanakan konten media sosial organisasi: kalender bulanan, daftar, dan papan status dari ide sampai tayang.",
      },
      { property: "og:title", content: "Kalender Konten — OrgTool" },
      {
        property: "og:description",
        content: "Rencana konten media sosial organisasi dari ide sampai tayang.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContentCalendarPage,
});

const ALL = "__all__";
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function CardChip({ plan, pillarColor, onOpen }: { plan: ContentPlan; pillarColor?: string | null; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-1 rounded border px-1.5 py-1 text-left text-[10px] transition-colors hover:bg-muted ${
        plan.is_archived ? "opacity-50" : ""
      }`}
      style={{ borderLeft: `3px solid ${pillarColor ?? "hsl(var(--border))"}` }}
    >
      <PlatformChip platform={plan.platform} />
      <span className={`min-w-0 flex-1 truncate ${plan.is_archived ? "line-through" : ""}`}>
        {plan.title}
      </span>
    </button>
  );
}

function BoardCard({ plan, pillarColor, onOpen }: { plan: ContentPlan; pillarColor?: string | null; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: plan.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}),
        borderLeft: `4px solid ${pillarColor ?? "hsl(var(--border))"}`,
      }}
      className={`cursor-grab space-y-2 rounded-xl border bg-card p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-60 shadow-lg" : ""
      } ${plan.is_archived ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className={`min-w-0 flex-1 text-left text-sm font-semibold leading-snug ${
            plan.is_archived ? "line-through opacity-60" : ""
          }`}
          {...listeners}
          {...attributes}
        >
          {plan.title}
        </button>
        <ArchiveMenu
          table="content_plans"
          recordId={plan.id}
          recordName={plan.title}
          isArchived={plan.is_archived}
          itemDivision={plan.owner_division}
          invalidateKeys={["content-plans"]}
        />
      </div>
      {plan.is_archived && <ArchivedBadge />}
      <div className="flex flex-wrap items-center gap-1.5">
        <PlatformChip platform={plan.platform} />
        <span className="text-[10px] text-muted-foreground">{label(plan.format)}</span>
      </div>
      {plan.scheduled_date && (
        <p className="text-[11px] text-muted-foreground">Tayang {formatDateID(plan.scheduled_date)}</p>
      )}
    </div>
  );
}

function BoardColumn({
  status,
  plans,
  colorOf,
  onOpen,
}: {
  status: ContentStatus;
  plans: ContentPlan[];
  colorOf: (id: string | null) => string | null;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label(status)}
        </p>
        <span className="text-xs text-muted-foreground">{plans.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-40 flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 ${
          isOver ? "border-primary bg-secondary" : "border-border bg-muted/40"
        }`}
      >
        {plans.map((p) => (
          <BoardCard key={p.id} plan={p} pillarColor={colorOf(p.pillar_id)} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </div>
  );
}

function ContentCalendarPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const { data: pillars = [] } = useQuery({ queryKey: ["content-pillars"], queryFn: fetchPillars });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => fetchEvents() });

  const [includeArchived, setIncludeArchived] = useState(false);
  const [view, setView] = useState<"kalender" | "daftar" | "papan">("kalender");
  const [cursor, setCursor] = useState(() => new Date());
  const [platform, setPlatform] = useState(ALL);
  const [pillarId, setPillarId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [division, setDivision] = useState(ALL);
  const [eventId, setEventId] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["content-plans", includeArchived],
    queryFn: () => fetchContentPlans(includeArchived),
  });

  const canEdit = canManageContent(profile?.role, profile?.division);

  const colorOf = useMemo(() => {
    const map = new Map(pillars.map((p) => [p.id, p.color_hex]));
    return (id: string | null) => (id ? (map.get(id) ?? null) : null);
  }, [pillars]);

  const nameOf = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.full_name as string]));
    return (id?: string | null) => (id ? (map.get(id) ?? "-") : "-");
  }, [profiles]);

  const filtered = useMemo(
    () =>
      plans.filter((p) => {
        if (platform !== ALL && p.platform !== platform) return false;
        if (pillarId !== ALL && p.pillar_id !== pillarId) return false;
        if (status !== ALL && p.status !== status) return false;
        if (division !== ALL && p.owner_division !== division) return false;
        if (eventId !== ALL && p.related_event_id !== eventId) return false;
        return true;
      }),
    [plans, platform, pillarId, status, division, eventId],
  );

  const move = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ContentStatus }) =>
      updateContentPlan(id, {
        status: next,
        ...(next === "Tayang" ? { published_at: new Date().toISOString() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-plans"] });
      toast.success("Status konten diperbarui.");
    },
    onError: (e: Error) => toast.error("Gagal memindahkan: " + e.message),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const next = e.over?.id ? (String(e.over.id) as ContentStatus) : null;
    if (!next) return;
    const plan = filtered.find((p) => p.id === id);
    if (!plan || plan.status === next) return;
    if (!canEdit) {
      toast.error("Kamu tidak berwenang mengubah status konten.");
      return;
    }
    move.mutate({ id, next });
  }

  /* ---------- Kalender bulanan ---------- */
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7; // Senin = 0
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - offset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const byDate = useMemo(() => {
    const map = new Map<string, ContentPlan[]>();
    for (const p of filtered) {
      if (!p.scheduled_date) continue;
      const key = p.scheduled_date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [filtered]);
  const unscheduled = filtered.filter((p) => !p.scheduled_date);
  const todayKey = toDateKey(new Date());

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender Konten</h1>
          <p className="text-sm text-muted-foreground">
            Rencana konten media sosial dari ide sampai tayang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ArchiveToggle
            id="content-archive"
            checked={includeArchived}
            onCheckedChange={setIncludeArchived}
          />
          {canEdit && (
            <Button
              onClick={() => {
                setFormDate(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Konten Baru
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-card p-1">
          {([
            ["kalender", "Kalender", CalendarDays],
            ["daftar", "Daftar", LayoutList],
            ["papan", "Papan", Trello],
          ] as const).map(([key, text, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                view === key ? "bg-secondary text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {text}
            </button>
          ))}
        </div>

        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Platform</SelectItem>
            {CONTENT_PLATFORMS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={pillarId} onValueChange={setPillarId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Pilar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Pilar</SelectItem>
            {pillars.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Status</SelectItem>
            {CONTENT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{label(s)}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={division} onValueChange={setDivision}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Divisi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Divisi</SelectItem>
            {divisions.map((d) => (<SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua Event</SelectItem>
            {events.map((e: { id: string; name: string }) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat konten…</p>}

      {view === "kalender" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              aria-label="Bulan sebelumnya"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm font-semibold">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
            <Button
              variant="outline"
              size="icon"
              aria-label="Bulan berikutnya"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {DAY_LABELS.map((d) => (<div key={d}>{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = toDateKey(d);
              const items = byDate.get(key) ?? [];
              const otherMonth = d.getMonth() !== cursor.getMonth();
              return (
                <div
                  key={key}
                  className={`min-h-24 rounded-lg border p-1 ${
                    otherMonth ? "bg-muted/40 opacity-60" : "bg-card"
                  } ${key === todayKey ? "border-primary" : ""}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">{d.getDate()}</span>
                    {canEdit && (
                      <button
                        type="button"
                        aria-label={`Tambah konten ${key}`}
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setFormDate(key);
                          setFormOpen(true);
                        }}
                      >
                        <Plus className="size-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {items.map((p) => (
                      <CardChip
                        key={p.id}
                        plan={p}
                        pillarColor={colorOf(p.pillar_id)}
                        onOpen={() => setDetailId(p.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {unscheduled.length > 0 && (
            <div className="rounded-xl border bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Belum dijadwalkan ({unscheduled.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {unscheduled.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDetailId(p.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${p.is_archived ? "opacity-50 line-through" : ""}`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "daftar" && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Pilar</th>
                <th className="px-4 py-3">Tayang</th>
                <th className="px-4 py-3">Copywriter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className={p.is_archived ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailId(p.id)}
                      className={`flex items-center gap-2 text-left font-medium ${
                        p.is_archived ? "line-through opacity-60" : ""
                      }`}
                    >
                      <PillarDot pillar={pillars.find((x) => x.id === p.pillar_id) ?? null} />
                      {p.title}
                    </button>
                    {p.is_archived && <ArchivedBadge className="mt-1" />}
                  </td>
                  <td className="px-4 py-3 text-xs">{p.platform} · {label(p.format)}</td>
                  <td className="px-4 py-3 text-xs">
                    {pillars.find((x) => x.id === p.pillar_id)?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDateID(p.scheduled_date)}</td>
                  <td className="px-4 py-3 text-xs">{nameOf(p.copywriter_id)}</td>
                  <td className="px-4 py-3"><ContentStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <ArchiveMenu
                      table="content_plans"
                      recordId={p.id}
                      recordName={p.title}
                      isArchived={p.is_archived}
                      itemDivision={p.owner_division}
                      invalidateKeys={["content-plans"]}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada rencana konten.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "papan" && (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {CONTENT_BOARD_STATUSES.map((s) => (
              <BoardColumn
                key={s}
                status={s}
                plans={filtered.filter((p) => p.status === s)}
                colorOf={colorOf}
                onOpen={setDetailId}
              />
            ))}
          </div>
        </DndContext>
      )}

      <ContentFormDialog open={formOpen} onOpenChange={setFormOpen} defaultDate={formDate} />
      <ContentDetailDialog contentId={detailId} onOpenChange={(v) => !v && setDetailId(null)} />
    </div>
  );
}
