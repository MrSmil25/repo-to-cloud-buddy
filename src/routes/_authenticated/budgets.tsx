import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Scissors, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyProfile } from "@/hooks/useProfile";
import { formatRupiah } from "@/lib/format";
import {
  BUDGET_STATUS_META,
  budgetProgress,
  buildBudgetTree,
  canManageParentBudget,
  canManageSubBudget,
  createBudget,
  deleteBudget,
  fetchBudgets,
  supabaseErrorMessage,
  updateBudget,
  type BudgetNode,
  type BudgetRow,
} from "@/lib/budgets";
import { fetchEventOptions } from "@/lib/deals";
import { BudgetFormDialog, type ParentBudgetValue } from "@/components/budgets/BudgetFormDialog";
import { SubBudgetFormDialog, type SubBudgetValue } from "@/components/budgets/SubBudgetFormDialog";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Anggaran Bertingkat — Kelola Pagu & Sub-pos Divisi" },
      {
        name: "description",
        content:
          "Kelola anggaran organisasi secara bertingkat: pagu induk dari Controller dan sub-pos yang dipecah tiap divisi, lengkap dengan sisa jatah dan realisasi.",
      },
      { property: "og:title", content: "Anggaran Bertingkat — Kelola Pagu & Sub-pos Divisi" },
      {
        property: "og:description",
        content:
          "Pantau alokasi, pembagian sub-pos, sisa jatah, dan realisasi anggaran tiap divisi dalam satu halaman.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetsPage,
});

function StatBlock({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function BudgetsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const role = profile?.role ?? "Anggota";
  const myDivision = profile?.division ?? null;

  const [periodFilter, setPeriodFilter] = useState<string>("__all");
  const [scopeFilter, setScopeFilter] = useState<string>("__all");
  const [eventFilter, setEventFilter] = useState<string>("__all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [parentDialog, setParentDialog] = useState<{ open: boolean; initial: BudgetRow | null }>({
    open: false,
    initial: null,
  });
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    parent: BudgetNode | null;
    initial: BudgetRow | null;
  }>({ open: false, parent: null, initial: null });
  const [formError, setFormError] = useState<string | null>(null);

  const budgetsQuery = useQuery({ queryKey: ["budgets"], queryFn: fetchBudgets });
  const { data: eventOptions } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });
  const eventNameOf = (id?: string | null) =>
    (eventOptions ?? []).find((e) => e.id === id)?.name ?? "Event";

  const periods = useMemo(() => {
    const set = new Set((budgetsQuery.data ?? []).map((b) => b.period));
    return [...set].sort();
  }, [budgetsQuery.data]);

  const tree = useMemo(() => {
    const rows = budgetsQuery.data ?? [];
    const filtered = rows.filter((r) => {
      if (periodFilter !== "__all" && r.period !== periodFilter) return false;
      if (r.parent_budget_id) return true;
      if (scopeFilter === "event" && !r.event_id) return false;
      if (scopeFilter === "division" && r.event_id) return false;
      if (eventFilter !== "__all" && r.event_id !== eventFilter) return false;
      return true;
    });
    return buildBudgetTree(filtered);
  }, [budgetsQuery.data, periodFilter, scopeFilter, eventFilter]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budgets"] });

  const parentMutation = useMutation({
    mutationFn: async (value: ParentBudgetValue) => {
      if (parentDialog.initial) return updateBudget(parentDialog.initial.id, value);
      return createBudget({ ...value, parent_budget_id: null });
    },
    onSuccess: () => {
      toast.success("Budget induk tersimpan.");
      setParentDialog({ open: false, initial: null });
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError(supabaseErrorMessage(e)),
  });

  const subMutation = useMutation({
    mutationFn: async (value: SubBudgetValue) => {
      const parent = subDialog.parent!;
      if (subDialog.initial) return updateBudget(subDialog.initial.id, value);
      return createBudget({
        ...value,
        period: parent.period,
        division: myDivision ?? parent.division ?? null,
        parent_budget_id: parent.id,
      });
    },
    onSuccess: () => {
      toast.success("Sub-pos tersimpan.");
      setSubDialog({ open: false, parent: null, initial: null });
      setFormError(null);
      invalidate();
    },
    // Pesan asli dari database (mis. melebihi jatah induk) ditampilkan apa adanya.
    onError: (e) => setFormError(supabaseErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      toast.success("Sub-pos dihapus.");
      invalidate();
    },
    onError: (e) => toast.error(supabaseErrorMessage(e)),
  });

  const canParent = canManageParentBudget(role);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggaran</h1>
          <p className="text-sm text-muted-foreground">
            Pagu induk dipecah menjadi sub-pos tiap divisi. Total sub-pos tidak boleh melebihi
            alokasi induk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Semua periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua periode</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua scope</SelectItem>
              <SelectItem value="division">Per Divisi</SelectItem>
              <SelectItem value="event">Per Event</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Semua event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Semua event</SelectItem>
              {(eventOptions ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canParent && (
            <Button
              onClick={() => {
                setFormError(null);
                setParentDialog({ open: true, initial: null });
              }}
            >
              <Plus className="size-4" /> Buat Budget Induk
            </Button>
          )}
        </div>
      </header>

      {budgetsQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : budgetsQuery.isError ? (
        <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">
          {supabaseErrorMessage(budgetsQuery.error)}
        </p>
      ) : tree.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada budget induk pada periode ini.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tree.map((node) => {
            const spentParent = Number(node.spent_idr ?? 0) + node.spentChildren;
            const progress = budgetProgress(spentParent, Number(node.allocated_idr ?? 0));
            const statusMeta = BUDGET_STATUS_META[node.status] ?? BUDGET_STATUS_META["On_Budget"]!;
            const open = expanded[node.id] ?? true;
            const canSub = canManageSubBudget(role, myDivision, node.division);

            return (
              <Card key={node.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{node.category}</h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {node.period}
                        {node.event_id
                          ? ` · Event ${eventNameOf(node.event_id)}`
                          : node.division
                            ? ` · Divisi ${node.division}`
                            : " · Organisasi"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canSub && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setFormError(null);
                            setSubDialog({ open: true, parent: node, initial: null });
                          }}
                        >
                          <Scissors className="size-4" /> Pecah jadi Sub-pos
                        </Button>
                      )}
                      {canParent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormError(null);
                            setParentDialog({ open: true, initial: node });
                          }}
                        >
                          <Pencil className="size-4" /> Edit Induk
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <StatBlock
                      label="Total Dialokasikan"
                      value={formatRupiah(node.allocated_idr)}
                    />
                    <StatBlock
                      label="Sudah Dibagi ke Sub-pos"
                      value={formatRupiah(node.allocatedChildren)}
                    />
                    <StatBlock
                      label="Belum Dibagi"
                      value={formatRupiah(node.unallocated)}
                      tone={node.unallocated === 0 ? "text-muted-foreground" : "text-emerald-700"}
                    />
                    <StatBlock
                      label="Terpakai"
                      value={formatRupiah(spentParent)}
                      tone={progress >= 100 ? "text-red-700" : ""}
                    />
                  </div>
                  <Progress value={progress} />
                </CardHeader>

                <CardContent className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => ({ ...s, [node.id]: !open }))}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    Sub-pos ({node.children.length})
                  </button>

                  {open &&
                    (node.children.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Belum ada sub-pos. Kadiv dapat memecah pagu ini menjadi sub-pos.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {node.children.map((child) => {
                          const childProgress = budgetProgress(
                            Number(child.spent_idr ?? 0),
                            Number(child.allocated_idr ?? 0),
                          );
                          const canEditChild = canManageSubBudget(
                            role,
                            myDivision,
                            node.division,
                            child.division,
                          );
                          return (
                            <li
                              key={child.id}
                              className="rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{child.category}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {child.division ?? "Organisasi"} ·{" "}
                                    {formatRupiah(child.spent_idr ?? 0)} dari{" "}
                                    {formatRupiah(child.allocated_idr)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                                    {childProgress}%
                                  </span>
                                  {canEditChild && (
                                    <>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Edit sub-pos"
                                        onClick={() => {
                                          setFormError(null);
                                          setSubDialog({
                                            open: true,
                                            parent: node,
                                            initial: child,
                                          });
                                        }}
                                      >
                                        <Pencil className="size-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Hapus sub-pos"
                                        onClick={() => deleteMutation.mutate(child.id)}
                                      >
                                        <Trash2 className="size-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${
                                    childProgress >= 100
                                      ? "bg-red-500"
                                      : childProgress >= 80
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${childProgress}%` }}
                                />
                              </div>
                              {child.notes && (
                                <p className="mt-1.5 text-xs text-muted-foreground">{child.notes}</p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={parentDialog.open}
        onOpenChange={(open) => setParentDialog((s) => ({ ...s, open }))}
        initial={parentDialog.initial}
        defaultPeriod={periods[0] ?? "Kepengurusan 2026"}
        submitting={parentMutation.isPending}
        errorMessage={formError}
        onSubmit={(value) => parentMutation.mutate(value)}
      />

      {subDialog.parent && (
        <SubBudgetFormDialog
          open={subDialog.open}
          onOpenChange={(open) => setSubDialog((s) => ({ ...s, open }))}
          parent={subDialog.parent}
          initial={subDialog.initial}
          submitting={subMutation.isPending}
          errorMessage={formError}
          onSubmit={(value) => subMutation.mutate(value)}
        />
      )}
    </div>
  );
}
