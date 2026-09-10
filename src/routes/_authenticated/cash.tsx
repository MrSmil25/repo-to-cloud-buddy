import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Eye, Plus, RefreshCw, Wallet } from "lucide-react";
import {
  PaymentHistoryDialog,
  formatDateTimeIndo,
} from "@/components/cash/PaymentHistoryDialog";
import { useDivisions, useMyProfile } from "@/hooks/useProfile";
import { formatDateID, formatRupiah, relativeTime } from "@/lib/format";
import { uploadDocument } from "@/lib/fund-requests";
import { ReceiptPreview } from "@/components/fund-requests/ReceiptPreview";
import {
  COLLECTION_KINDS,
  COLLECTION_STATUSES,
  COLLECTION_STATUS_CLASS,
  KIND_META,
  PAYMENT_STATUS_META,
  canManageCash,
  claimPayment,
  createCashExpense,
  createCollection,
  fetchCashBalance,
  fetchCashExpenses,
  fetchCollectionPayments,
  fetchCollectionProgress,
  fetchMyBills,
  fetchMyVerifications,
  fetchPendingClaims,
  generateBills,
  rejectPayment,
  updateCollectionStatus,
  verifyPayment,
  type CollectionPayment,
  type CollectionProgress,
} from "@/lib/cash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/cash")({
  head: () => ({
    meta: [
      { title: "Kas & Iuran — OrgTool" },
      { name: "description", content: "Kelola kas organisasi, iuran anggota, dan pengeluaran kas." },
      { property: "og:title", content: "Kas & Iuran — OrgTool" },
      { property: "og:description", content: "Kelola kas organisasi, iuran anggota, dan pengeluaran kas." },
    ],
  }),
  component: CashPage,
});

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{label}</span>
  );
}

function CashPage() {
  const { data: profile } = useMyProfile();
  const manage = canManageCash(profile?.role);

  const { data: balance } = useQuery({ queryKey: ["cash-balance"], queryFn: fetchCashBalance });
  const { data: pending = [] } = useQuery({
    queryKey: ["cash-pending-claims"],
    queryFn: fetchPendingClaims,
    enabled: manage,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
            <Wallet className="size-5" />
          </span>
          <div>
            <p className="text-sm text-emerald-800/70">Saldo Kas</p>
            <p className="text-3xl font-bold text-emerald-700">
              {balance ? formatRupiah(balance.saldo_kas) : "…"}
            </p>
            <p className="mt-1 text-sm text-emerald-800/70">
              Masuk {formatRupiah(balance?.total_masuk ?? 0)} · Keluar{" "}
              {formatRupiah(balance?.total_keluar ?? 0)}
            </p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="bills">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="bills">Tagihan Saya</TabsTrigger>
          {manage && <TabsTrigger value="programs">Kelola Program</TabsTrigger>}
          {manage && (
            <TabsTrigger value="verify">
              Verifikasi
              {pending.length > 0 && (
                <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="expenses">Pengeluaran Kas</TabsTrigger>
        </TabsList>

        <TabsContent value="bills" className="mt-4">
          <MyBillsTab />
        </TabsContent>
        {manage && (
          <TabsContent value="programs" className="mt-4">
            <ProgramsTab />
          </TabsContent>
        )}
        {manage && (
          <TabsContent value="verify" className="mt-4">
            <VerifyTab claims={pending} />
          </TabsContent>
        )}
        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab canRecord={manage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Tagihan Saya ---------------- */

function MyBillsTab() {
  const { data: bills = [], isLoading } = useQuery({ queryKey: ["my-bills"], queryFn: fetchMyBills });
  const [active, setActive] = useState<CollectionPayment | null>(null);
  const [history, setHistory] = useState<CollectionPayment | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat tagihan…</p>;
  if (bills.length === 0)
    return (
      <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Belum ada tagihan kas untuk kamu.
      </p>
    );

  return (
    <>
      <div className="space-y-3">
        {bills.map((bill) => {
          const c = bill.collections;
          const kind = KIND_META[c?.kind ?? "Kas_Rutin"] ?? KIND_META['Kas_Rutin']!;
          const st = PAYMENT_STATUS_META[bill.status] ?? PAYMENT_STATUS_META['Belum_Bayar']!;
          const due = c?.due_date ? new Date(c.due_date) : null;
          const soon = due ? due.getTime() - Date.now() < 3 * 86400000 : false;
          return (
            <div key={bill.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{c?.title ?? "Program kas"}</h3>
                    <Badge label={kind.label} className={kind.className} />
                    <Badge label={st.label} className={st.className} />
                  </div>
                  {c?.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  )}
                  <p className="mt-2 text-lg font-bold">{formatRupiah(c?.amount_per_person ?? 0)}</p>
                  {c?.due_date && (
                    <p className={`text-sm ${soon ? "font-semibold text-red-600" : "text-muted-foreground"}`}>
                      Batas waktu: {formatDateID(c.due_date)}
                    </p>
                  )}
                </div>
                {(bill.status === "Belum_Bayar" || bill.status === "Ditolak") && (
                  <Button onClick={() => setActive(bill)}>Bayar / Klaim</Button>
                )}
              </div>

              {bill.status === "Ditolak" && bill.reject_reason && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  Alasan penolakan: {bill.reject_reason}
                </p>
              )}
              {bill.status === "Menunggu_Verifikasi" && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-amber-700">Menunggu verifikasi bendahara.</p>
                  <ReceiptPreview path={bill.proof_url} label="Bukti bayar" />
                </div>
              )}
              {bill.status === "Lunas" && (
                <div className="mt-3 rounded-xl border bg-muted/30 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" /> Lunas
                    {bill.verified_at ? ` · ${formatDateTimeIndo(bill.verified_at)}` : ""}
                  </p>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Jumlah dibayar</dt>
                      <dd className="font-medium">{formatRupiah(bill.amount_paid ?? 0)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Diklaim pada</dt>
                      <dd className="font-medium">{formatDateTimeIndo(bill.claimed_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Diverifikasi oleh</dt>
                      <dd className="font-medium">
                        {bill.verifier?.full_name ?? "—"}
                        {bill.verified_at ? ` · ${formatDateTimeIndo(bill.verified_at)}` : ""}
                      </dd>
                    </div>
                  </dl>
                  {bill.reject_reason && (
                    <p className="mt-2 text-xs text-amber-700">
                      Klaim sebelumnya sempat ditolak: {bill.reject_reason}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setHistory(bill)}
                  >
                    <Eye className="size-4" /> Lihat Bukti
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ClaimDialog bill={active} onClose={() => setActive(null)} />
      <PaymentHistoryDialog payment={history} onClose={() => setHistory(null)} />
    </>
  );
}

function ClaimDialog({ bill, onClose }: { bill: CollectionPayment | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const nominal = bill?.collections?.amount_per_person ?? 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!bill) return;
      if (!file) throw new Error("Bukti pembayaran wajib diunggah.");
      const path = await uploadDocument(file, "kas");
      await claimPayment({
        id: bill.id,
        amount_paid: Number(amount || nominal),
        proof_url: path,
      });
    },
    onSuccess: () => {
      toast.success("Klaim terkirim, menunggu verifikasi bendahara.");
      qc.invalidateQueries({ queryKey: ["my-bills"] });
      qc.invalidateQueries({ queryKey: ["cash-pending-claims"] });
      qc.invalidateQueries({ queryKey: ["my-cash-bill-count"] });
      setAmount("");
      setFile(null);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!bill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bayar / Klaim</DialogTitle>
          <DialogDescription>{bill?.collections?.title}</DialogDescription>
        </DialogHeader>
        {bill?.status === "Ditolak" && bill.reject_reason && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Klaim sebelumnya ditolak: {bill.reject_reason}
          </p>
        )}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nominal tagihan: <span className="font-semibold text-foreground">{formatRupiah(nominal)}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Jumlah Dibayar</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              placeholder={String(nominal)}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proof">Bukti Pembayaran (wajib)</Label>
            <Input
              id="proof"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Mengirim…" : "Kirim"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Kelola Program ---------------- */

function ProgramsTab() {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["collection-progress"],
    queryFn: fetchCollectionProgress,
  });
  const [openForm, setOpenForm] = useState(false);
  const [detail, setDetail] = useState<CollectionProgress | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpenForm(true)}>
          <Plus className="size-4" /> Buat Program
        </Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Memuat program…</p>}
      {!isLoading && programs.length === 0 && (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Belum ada program kas.
        </p>
      )}
      <div className="space-y-3">
        {programs.map((p) => {
          const kind = KIND_META[p.kind] ?? KIND_META['Kas_Rutin']!;
          return (
            <button
              key={p.collection_id}
              onClick={() => setDetail(p)}
              className="w-full rounded-2xl border bg-card p-5 text-left shadow-sm transition-colors hover:bg-accent/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{p.title}</h3>
                <Badge label={kind.label} className={kind.className} />
                <Badge
                  label={p.status}
                  className={COLLECTION_STATUS_CLASS[p.status] ?? "bg-muted text-muted-foreground"}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatRupiah(p.amount_per_person)} / orang ·{" "}
                {p.due_date ? `Batas ${formatDateID(p.due_date)}` : "Tanpa batas waktu"} ·{" "}
                {p.target_division ?? "Seluruh Organisasi"}
              </p>
              <p className="mt-2 text-sm font-medium">
                {p.total_lunas} dari {p.total_tagihan} lunas · {formatRupiah(p.total_terkumpul)} terkumpul
              </p>
            </button>
          );
        })}
      </div>
      <CollectionFormDialog open={openForm} onOpenChange={setOpenForm} />
      <ProgramDetailDialog program={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function CollectionFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const { data: divisions = [] } = useDivisions();
  const [kind, setKind] = useState<string>("Kas_Rutin");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scope, setScope] = useState<"org" | "division">("org");
  const [division, setDivision] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createCollection({
        kind,
        title,
        description,
        amount_per_person: Number(amount || 0),
        due_date: dueDate || null,
        target_division: scope === "division" ? division : null,
      }),
    onSuccess: ({ generated }) => {
      toast.success(`Program dibuat, ${generated} tagihan diterbitkan.`);
      qc.invalidateQueries({ queryKey: ["collection-progress"] });
      qc.invalidateQueries({ queryKey: ["my-bills"] });
      setTitle("");
      setDescription("");
      setAmount("");
      setDueDate("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buat Program Kas</DialogTitle>
          <DialogDescription>Tagihan otomatis diterbitkan ke anggota sasaran.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Jenis</Label>
            <div className="flex gap-4">
              {COLLECTION_KINDS.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="kind"
                    checked={kind === k}
                    onChange={() => setKind(k)}
                  />
                  {KIND_META[k]!.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Deskripsi</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amt">Nominal per Orang (Rp)</Label>
            <Input id="amt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due">Deadline</Label>
            <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sasaran</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={scope === "org"} onChange={() => setScope("org")} />
                Seluruh Organisasi
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={scope === "division"}
                  onChange={() => setScope("division")}
                />
                Divisi tertentu
              </label>
            </div>
            {scope === "division" && (
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={!title || !amount || (scope === "division" && !division) || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgramDetailDialog({
  program,
  onClose,
}: {
  program: CollectionProgress | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [history, setHistory] = useState<CollectionPayment | null>(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["collection-payments", program?.collection_id],
    queryFn: () => fetchCollectionPayments(program!.collection_id),
    enabled: !!program,
  });

  const regenerate = useMutation({
    mutationFn: () => generateBills(program!.collection_id),
    onSuccess: (n) => {
      toast.success(`${n} tagihan baru diterbitkan.`);
      qc.invalidateQueries({ queryKey: ["collection-payments", program?.collection_id] });
      qc.invalidateQueries({ queryKey: ["collection-progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) => updateCollectionStatus(program!.collection_id, status),
    onSuccess: () => {
      toast.success("Status program diperbarui.");
      qc.invalidateQueries({ queryKey: ["collection-progress"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!program} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program?.title}</DialogTitle>
          <DialogDescription>
            {program ? `${formatRupiah(program.amount_per_person)} / orang` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={regenerate.isPending}
            onClick={() => regenerate.mutate()}
          >
            <RefreshCw className="size-4" /> Terbitkan Ulang Tagihan
          </Button>
          <Select value={program?.status ?? "Aktif"} onValueChange={(v) => changeStatus.mutate(v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="divide-y rounded-xl border">
          {rows.map((r) => {
            const st = PAYMENT_STATUS_META[r.status] ?? PAYMENT_STATUS_META['Belum_Bayar']!;
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{r.profiles?.full_name ?? "Anggota"}</span>
                <span className="flex items-center gap-2">
                  <Badge label={st.label} className={st.className} />
                  {r.status === "Lunas" && (
                    <Button size="sm" variant="outline" onClick={() => setHistory(r)}>
                      <Eye className="size-4" /> Riwayat
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Belum ada tagihan.</li>
          )}
        </ul>
        <PaymentHistoryDialog payment={history} onClose={() => setHistory(null)} />
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Verifikasi ---------------- */

function VerifyTab({ claims }: { claims: CollectionPayment[] }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<CollectionPayment | null>(null);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"pending" | "history">("pending");
  const [history, setHistory] = useState<CollectionPayment | null>(null);
  const { data: myVerifications = [] } = useQuery({
    queryKey: ["my-cash-verifications"],
    queryFn: fetchMyVerifications,
    enabled: mode === "history",
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["cash-pending-claims"] });
    qc.invalidateQueries({ queryKey: ["collection-progress"] });
    qc.invalidateQueries({ queryKey: ["cash-balance"] });
    qc.invalidateQueries({ queryKey: ["my-bills"] });
  }

  const verify = useMutation({
    mutationFn: (id: string) => verifyPayment(id),
    onSuccess: () => {
      toast.success("Pembayaran diverifikasi.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: () => rejectPayment(rejecting!.id, reason),
    onSuccess: () => {
      toast.success("Klaim ditolak.");
      setRejecting(null);
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1">
        <button
          type="button"
          onClick={() => setMode("pending")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Menunggu Verifikasi
        </button>
        <button
          type="button"
          onClick={() => setMode("history")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Riwayat Verifikasi Saya
        </button>
      </div>

      {mode === "history" ? (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-semibold">Program</th>
                <th className="px-4 py-2 font-semibold">Anggota</th>
                <th className="px-4 py-2 font-semibold">Jumlah</th>
                <th className="px-4 py-2 font-semibold">Diverifikasi Pada</th>
                <th className="px-4 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myVerifications.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-2">{v.collections?.title ?? "-"}</td>
                  <td className="px-4 py-2">{v.profiles?.full_name ?? "-"}</td>
                  <td className="px-4 py-2">{formatRupiah(v.amount_paid ?? 0)}</td>
                  <td className="px-4 py-2">{formatDateTimeIndo(v.verified_at)}</td>
                  <td className="px-4 py-2">
                    <Button size="sm" variant="outline" onClick={() => setHistory(v)}>
                      <Eye className="size-4" /> Lihat Bukti
                    </Button>
                  </td>
                </tr>
              ))}
              {myVerifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted-foreground">
                    Belum ada tagihan yang kamu verifikasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaymentHistoryDialog payment={history} onClose={() => setHistory(null)} />
        </div>
      ) : claims.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Tidak ada klaim yang menunggu verifikasi.
        </p>
      ) : (
      <div className="space-y-3">
        {claims.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.profiles?.full_name ?? "Anggota"}</p>
                <p className="text-sm text-muted-foreground">{c.collections?.title}</p>
                <p className="mt-1 text-sm">
                  Diklaim {formatRupiah(c.amount_paid ?? 0)} · {relativeTime(c.claimed_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={verify.isPending} onClick={() => verify.mutate(c.id)}>
                  Verifikasi
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejecting(c)}>
                  Tolak
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <ReceiptPreview path={c.proof_url} label="Bukti bayar" />
            </div>
          </div>
        ))}
      </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Klaim</DialogTitle>
            <DialogDescription>Beri alasan agar anggota bisa memperbaiki.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Batal
            </Button>
            <Button disabled={!reason || reject.isPending} onClick={() => reject.mutate()}>
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Pengeluaran Kas ---------------- */

function ExpensesTab({ canRecord }: { canRecord: boolean }) {
  const qc = useQueryClient();
  const { data: expenses = [] } = useQuery({
    queryKey: ["cash-expenses"],
    queryFn: fetchCashExpenses,
  });
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const path = file ? await uploadDocument(file, "kas-expense") : null;
      await createCashExpense({
        expense_date: date,
        description,
        amount_idr: Number(amount || 0),
        proof_url: path,
      });
    },
    onSuccess: () => {
      toast.success("Pengeluaran kas dicatat.");
      qc.invalidateQueries({ queryKey: ["cash-expenses"] });
      qc.invalidateQueries({ queryKey: ["cash-balance"] });
      setDescription("");
      setAmount("");
      setFile(null);
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount_idr ?? 0), 0), [expenses]);

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Pengeluaran ini diambil dari dompet Kas, terpisah dari keuangan operasional organisasi.
      </p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total pengeluaran kas: {formatRupiah(total)}</p>
        {canRecord && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Catat Pengeluaran Kas
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {expenses.map((e) => (
          <div key={e.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{e.description}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateID(e.expense_date)} · dicatat oleh {e.profiles?.full_name ?? "-"}
                </p>
              </div>
              <p className="text-lg font-bold text-red-600">{formatRupiah(e.amount_idr)}</p>
            </div>
            {e.proof_url && (
              <div className="mt-3">
                <ReceiptPreview path={e.proof_url} label="Bukti pengeluaran" />
              </div>
            )}
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
            Belum ada pengeluaran kas.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pengeluaran Kas</DialogTitle>
            <DialogDescription>Mengurangi saldo kas organisasi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edate">Tanggal</Label>
              <Input id="edate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edesc">Deskripsi</Label>
              <Textarea id="edesc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eamt">Jumlah (Rp)</Label>
              <Input id="eamt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eproof">Bukti (opsional)</Label>
              <Input
                id="eproof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={!description || !amount || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
