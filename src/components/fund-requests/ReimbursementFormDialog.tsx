import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BreakdownEditor } from "./BreakdownEditor";
import { formatRupiah } from "@/lib/format";
import {
  URGENCIES,
  URGENCY_LABEL,
  fetchEventOptions,
  uploadDocument,
  type BreakdownItem,
  type NewReimbursement,
} from "@/lib/fund-requests";

const NONE = "__none__";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: NewReimbursement) => void;
  saving: boolean;
};

export function ReimbursementFormDialog({ open, onOpenChange, onSubmit, saving }: Props) {
  const [purpose, setPurpose] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [urgency, setUrgency] = useState<string>("Normal");
  const [eventId, setEventId] = useState<string>(NONE);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BreakdownItem[]>([]);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { data: events } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });

  const valid =
    purpose.trim().length > 0 && amount > 0 && expenseDate.length > 0 && !!receiptPath;

  function reset() {
    setPurpose("");
    setExpenseDate("");
    setAmount(0);
    setUrgency("Normal");
    setEventId(NONE);
    setNotes("");
    setItems([]);
    setReceiptPath(null);
    setReceiptName("");
  }

  async function handleUpload(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadDocument(file, "receipts");
      setReceiptPath(path);
      setReceiptName(file.name);
      toast.success("Struk berhasil diunggah.");
    } catch (err) {
      toast.error("Gagal mengunggah struk: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!valid) return;
    onSubmit({
      purpose: purpose.trim(),
      amount_idr: Math.round(amount),
      urgency,
      breakdown: items.length ? items : null,
      event_id: eventId === NONE ? null : eventId,
      notes: notes.trim() || null,
      expense_date: expenseDate,
      receipt_url: receiptPath as string,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Minta Reimbursement</DialogTitle>
          <DialogDescription>
            Untuk pengeluaran yang sudah kamu talangi sendiri. Nominal harus sesuai struk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Perihal / Untuk apa *</Label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Beli spanduk untuk acara talkshow"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tanggal Pengeluaran *</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah yang Ditalangi *</Label>
              <Input
                type="number"
                min={0}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{formatRupiah(amount)}</p>
            </div>
          </div>

          <BreakdownEditor items={items} onChange={setItems} />

          <div className="space-y-1.5 rounded-lg border border-dashed p-3">
            <Label>Struk / Bukti Pembayaran *</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" disabled={uploading}>
                <label className="cursor-pointer">
                  <Upload className="size-4" />
                  {uploading ? "Mengunggah…" : receiptPath ? "Ganti Struk" : "Unggah Struk"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                </label>
              </Button>
              {receiptPath && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="size-4" /> {receiptName}
                </span>
              )}
            </div>
            {!receiptPath && (
              <p className="text-xs text-destructive">
                Struk wajib dilampirkan untuk reimbursement.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Urgensi</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCIES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {URGENCY_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Terkait Event (opsional)</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tidak terkait event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tidak terkait event</SelectItem>
                  {(events ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid || saving || uploading}>
            {saving ? "Menyimpan…" : "Kirim Reimbursement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
