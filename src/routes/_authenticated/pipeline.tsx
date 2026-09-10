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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useDivisions } from "@/hooks/useProfile";
import {
  DEAL_STAGES,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  STAGE_META,
  fetchDeals,
  initials,
  updateDealStage,
  type DealStage,
  type DealWithRelations,
} from "@/lib/deals";
import { formatDateID, formatRupiah } from "@/lib/format";
import { DealFormDialog } from "@/components/deals/DealFormDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline Deal — OrgTool" },
      { name: "description", content: "Papan kanban pipeline kerja sama: prospek, negosiasi, hingga deal tercapai." },
      { property: "og:title", content: "Pipeline Deal — OrgTool" },
      { property: "og:description", content: "Papan kanban pipeline kerja sama: prospek, negosiasi, hingga deal tercapai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PipelinePage,
});

function DealCard({ deal }: { deal: DealWithRelations }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={`cursor-grab space-y-2 rounded-xl border bg-card p-3 text-left shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{deal.name}</p>
        {deal.profiles && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-primary">
            {initials(deal.profiles.full_name)}
          </span>
        )}
      </div>
      {deal.companies && <p className="text-xs text-muted-foreground">{deal.companies.name}</p>}
      <p className="text-sm font-bold">{formatRupiah(deal.value_idr)}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold">
          {DEAL_TYPE_LABELS[deal.deal_type] ?? deal.deal_type}
        </span>
        {deal.events && (
          <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium">
            🎯 {deal.events.name}
          </span>
        )}
      </div>
      {deal.deadline && (
        <p className="text-[11px] text-muted-foreground">Tenggat {formatDateID(deal.deadline)}</p>
      )}
    </div>
  );
}

function Column({
  stage,
  deals,
}: {
  stage: DealStage;
  deals: DealWithRelations[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + Number(d.value_idr ?? 0), 0);
  const meta = STAGE_META[stage]!;
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={`rounded-t-xl px-3 py-2 ${meta.header}`}>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{meta.label}</span>
          <span className="rounded-full bg-background/25 px-2 text-xs">{deals.length}</span>
        </div>
        <p className="text-xs opacity-90">{formatRupiah(total)}</p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-b-xl border border-t-0 bg-muted/40 p-2 ${
          isOver ? "ring-2 ring-primary/50" : ""
        }`}
        style={{ minHeight: 220 }}
      >
        {deals.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Kosong</p>
        )}
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

function PipelinePage() {
  const queryClient = useQueryClient();
  const { data: divisions = [] } = useDivisions();
  const { data: deals = [], isLoading } = useQuery({ queryKey: ["deals"], queryFn: fetchDeals });
  const [typeFilter, setTypeFilter] = useState("all");
  const [divFilter, setDivFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const mutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) => updateDealStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Tahap deal diperbarui");
    },
    onError: (e: Error) => toast.error("Gagal memperbarui: " + e.message),
  });

  const filtered = useMemo(
    () =>
      deals.filter(
        (d) =>
          (typeFilter === "all" || d.deal_type === typeFilter) &&
          (divFilter === "all" || d.owner_division === divFilter),
      ),
    [deals, typeFilter, divFilter],
  );

  function handleDragEnd(e: DragEndEvent) {
    const stage = e.over?.id as DealStage | undefined;
    const id = String(e.active.id);
    if (!stage) return;
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    mutation.mutate({ id, stage });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Deal</h1>
          <p className="text-sm text-muted-foreground">
            Geser kartu antar kolom untuk memperbarui tahap kerja sama.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Deal Baru
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Semua tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            {DEAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{DEAL_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={divFilter} onValueChange={setDivFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Semua divisi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua divisi</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {DEAL_STAGES.map((s) => (
              <Column key={s} stage={s} deals={filtered.filter((d) => d.stage === s)} />
            ))}
          </div>
        </DndContext>
      )}

      <DealFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
