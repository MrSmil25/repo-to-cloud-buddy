import { eventOptionLabel } from "@/lib/events";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadDocument } from "@/lib/fund-requests";
import { formatRupiah } from "@/lib/format";
import {
  VISIBILITIES,
  createTransaction,
  fetchApprovedFundRequests,
  fetchCategories,
  fetchDealOptions,
  fetchEventOptions,
  todayISO,
  updateTransaction,
  type TransactionType,
  type TransactionVisibility,
  type TransactionWithRelations,
} from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
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

type LinkKind = "fund_request" | "deal" | "event" | "none";

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction?: TransactionWithRelations | null;
}) {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories", "active"],
    queryFn: () => fetchCategories(true),
  });
  const { data: fundRequests = [] } = useQuery({
    queryKey: ["approved-fund-requests"],
    queryFn: fetchApprovedFundRequests,
    enabled: open,
  });
  const { data: deals = [] } = useQuery({ queryKey: ["deal-options"], queryFn: fetchDealOptions, enabled: open });
  const { data: events = [] } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions, enabled: open });

  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>("Expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [linkKind, setLinkKind] = useState<LinkKind>("none");
  const [linkId, setLinkId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<TransactionVisibility>("Public_Org");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(transaction?.transaction_date ?? todayISO());
    setType(transaction?.type ?? "Expense");
    setCategory(transaction?.category ?? "");
    setAmount(transaction ? String(transaction.amount_idr) : "");
    setDescription(transaction?.description ?? "");
    if (transaction?.related_fund_request_id) {
      setLinkKind("fund_request");
      setLinkId(transaction.related_fund_request_id);
    } else if (transaction?.related_deal_id) {
      setLinkKind("deal");
      setLinkId(transaction.related_deal_id);
    } else if (transaction?.related_event_id) {
      setLinkKind("event");
      setLinkId(transaction.related_event_id);
    } else {
      setLinkKind("none");
      setLinkId("");
    }
    setFile(null);
    setProofPath(transaction?.proof_url ?? null);
    setVisibility(transaction?.visibility ?? "Public_Org");
  }, [open, transaction]);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.type === type || c.type === "Both"),
    [categories, type],
  );

  const amountNumber = Number(amount.replace(/\D/g, "")) || 0;

  async function save() {
    if (!description.trim()) { toast.error("Deskripsi wajib diisi"); return; }
    if (!category) { toast.error("Kategori wajib dipilih"); return; }
    if (amountNumber <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    if (linkKind !== "none" && !linkId) { toast.error("Pilih item terkait"); return; }
    setSaving(true);
    try {
      let path = proofPath;
      if (file) path = await uploadDocument(file, "transactions");
      const input = {
        transaction_date: date,
        type,
        category,
        amount_idr: amountNumber,
        description: description.trim(),
        related_fund_request_id: linkKind === "fund_request" ? linkId : null,
        related_deal_id: linkKind === "deal" ? linkId : null,
        related_event_id: linkKind === "event" ? linkId : null,
        proof_url: path,
        visibility,
      };
      if (transaction) await updateTransaction(transaction.id, input);
      else await createTransaction(input);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-finance"] });
      toast.success(transaction ? "Transaksi diperbarui" : "Transaksi dicatat");
      onOpenChange(false);
    } catch (e) {
      toast.error("Gagal menyimpan: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaksi" : "Catat Transaksi"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tanggal *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe *</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => {
                  setType(v as TransactionType);
                  setCategory("");
                }}
                className="flex gap-4 pt-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="Income" /> <span className="text-emerald-700">Income</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="Expense" /> <span className="text-red-700">Expense</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kategori *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: c.color_hex ?? "#94a3b8" }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
                {categoryOptions.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Belum ada kategori aktif</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Jumlah (IDR) *</Label>
            <Input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
            {amountNumber > 0 && (
              <p className="text-xs text-muted-foreground">{formatRupiah(amountNumber)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Deskripsi *</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Pembayaran sewa venue seminar"
            />
          </div>

          <div className="space-y-2">
            <Label>Sumber / Terkait</Label>
            <RadioGroup
              value={linkKind}
              onValueChange={(v) => {
                setLinkKind(v as LinkKind);
                setLinkId("");
              }}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="fund_request" /> Dari Pengajuan Dana Approved</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="deal" /> Terkait Deal</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="event" /> Terkait Event</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="none" /> Tidak Terkait</label>
            </RadioGroup>
            {linkKind === "fund_request" && (
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger><SelectValue placeholder="Pilih pengajuan dana" /></SelectTrigger>
                <SelectContent>
                  {fundRequests.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.request_number ?? "FR"} — {f.purpose} ({formatRupiah(f.amount_idr)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {linkKind === "deal" && (
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger><SelectValue placeholder="Pilih deal" /></SelectTrigger>
                <SelectContent>
                  {deals.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
            {linkKind === "event" && (
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (<SelectItem key={ev.id} value={ev.id}>{eventOptionLabel(ev)}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Upload Bukti</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {proofPath && !file && <p className="text-xs text-muted-foreground">Bukti sudah terunggah</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as TransactionVisibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITIES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {VISIBILITIES.find((v) => v.value === visibility)?.hint}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
