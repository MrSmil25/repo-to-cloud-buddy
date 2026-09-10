import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useDivisions, useMyProfile } from "@/hooks/useProfile";
import { formatDateID, formatRupiah } from "@/lib/format";
import { resolveDocUrl } from "@/lib/fund-requests";
import {
  canManageTransactions,
  deleteTransaction,
  fetchCategories,
  fetchEventOptions,
  fetchTransactions,
  monthRange,
  transactionDivision,
  type TransactionWithRelations,
} from "@/lib/transactions";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Feed Keuangan — OrgTool" },
      { name: "description", content: "Timeline transparan pemasukan dan pengeluaran organisasi." },
      { property: "og:title", content: "Feed Keuangan — OrgTool" },
      { property: "og:description", content: "Timeline transparan pemasukan dan pengeluaran organisasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();
  const canManage = canManageTransactions(profile?.role);

  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [division, setDivision] = useState("all");
  const [event, setEvent] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithRelations | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", from, to],
    queryFn: () => fetchTransactions({ from, to }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories", "all"],
    queryFn: () => fetchCategories(false),
  });
  const { data: events = [] } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });

  const categoryColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) if (c.color_hex) m.set(c.name, c.color_hex);
    return m;
  }, [categories]);

  const rows = useMemo(
    () =>
      transactions.filter((t) => {
        if (type !== "all" && t.type !== type) return false;
        if (category !== "all" && t.category !== category) return false;
        if (division !== "all" && transactionDivision(t) !== division) return false;
        if (event !== "all" && t.related_event_id !== event) return false;
        return true;
      }),
    [transactions, type, category, division, event],
  );

  const totalIncome = rows.filter((t) => t.type === "Income").reduce((s, t) => s + Number(t.amount_idr), 0);
  const totalExpense = rows.filter((t) => t.type === "Expense").reduce((s, t) => s + Number(t.amount_idr), 0);
  const net = totalIncome - totalExpense;

  async function openProof(path: string) {
    const url = await resolveDocUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Bukti tidak dapat dibuka");
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTransaction(deleting.id);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-finance"] });
      toast.success("Transaksi dihapus");
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Setiap rupiah yang masuk dan keluar, terbuka untuk seluruh anggota.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Catat Transaksi
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs">Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipe</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="Income">Income</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Divisi</Label>
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua divisi</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Event</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua event</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 break-words">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Expense</p>
          <p className="mt-1 text-xl font-bold text-red-600 break-words">{formatRupiah(totalExpense)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`mt-1 text-xl font-bold break-words ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatRupiah(net)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Belum ada transaksi pada periode ini.
          </p>
        )}
        {rows.length > 0 && (
          <ol className="relative space-y-4 border-l-2 border-border pl-8">
            {rows.map((t) => {
              const income = t.type === "Income";
              const div = transactionDivision(t);
              const color = categoryColor.get(t.category) ?? "#94a3b8";
              return (
                <li key={t.id} className="relative">
                  <span
                    className={`absolute -left-[41px] flex size-8 items-center justify-center rounded-full border-2 border-background ${
                      income ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {income ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{t.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium"
                            style={{ borderColor: color, color, backgroundColor: `${color}1a` }}
                          >
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {t.category}
                          </span>
                          {div && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{div}</span>
                          )}
                          {t.visibility !== "Public_Org" && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                              {t.visibility.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <p className={`whitespace-nowrap text-right font-bold ${income ? "text-emerald-600" : "text-red-600"}`}>
                          {income ? "+" : "−"} {formatRupiah(t.amount_idr)}
                        </p>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7" aria-label="Aksi">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(t);
                                  setFormOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(t)}>
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDateID(t.transaction_date)} · dicatat oleh{" "}
                        <span className="font-medium text-foreground">{t.profiles?.full_name ?? "—"}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {t.fund_requests && (
                          <Link
                            to="/fund-requests/$id"
                            params={{ id: t.fund_requests.id }}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {t.fund_requests.request_number ?? "Pengajuan Dana"}
                          </Link>
                        )}
                        {t.deals && (
                          <Link to="/pipeline" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="size-3" /> Deal: {t.deals.name}
                          </Link>
                        )}
                        {t.events && (
                          <Link
                            to="/events/$id"
                            params={{ id: t.events.id }}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" /> Terkait Event: {t.events.name}
                          </Link>
                        )}
                        {t.proof_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => openProof(t.proof_url!)}
                          >
                            <FileText className="size-3" /> Lihat Bukti
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} transaction={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.description}" sebesar {formatRupiah(deleting?.amount_idr)} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
