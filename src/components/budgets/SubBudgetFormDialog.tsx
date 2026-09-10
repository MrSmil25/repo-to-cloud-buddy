import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/format";
import type { BudgetNode, BudgetRow } from "@/lib/budgets";

export type SubBudgetValue = {
  category: string;
  allocated_idr: number;
  notes: string | null;
};

export function SubBudgetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  errorMessage,
  parent,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: SubBudgetValue) => void;
  submitting?: boolean;
  errorMessage?: string | null;
  parent: BudgetNode;
  initial?: BudgetRow | null;
}) {
  const [form, setForm] = useState<SubBudgetValue>({
    category: "",
    allocated_idr: 0,
    notes: null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      category: initial?.category ?? "",
      allocated_idr: Number(initial?.allocated_idr ?? 0),
      notes: initial?.notes ?? null,
    });
  }, [open, initial]);

  // Sisa jatah: alokasi induk - sub-pos lain (baris yang sedang diedit tidak dihitung).
  const otherAllocated = parent.children
    .filter((c) => c.id !== initial?.id)
    .reduce((s, c) => s + Number(c.allocated_idr ?? 0), 0);
  const remaining = Number(parent.allocated_idr ?? 0) - otherAllocated;
  const afterThis = remaining - form.allocated_idr;

  const valid = form.category.trim().length > 0 && form.allocated_idr > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Sub-pos" : "Pecah jadi Sub-pos"}</DialogTitle>
          <DialogDescription>
            Sub-pos dari budget induk “{parent.category}”
            {parent.division ? ` · divisi ${parent.division}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p>
              Sisa jatah divisi yang belum dibagi:{" "}
              <span className="font-semibold">{formatRupiah(Math.max(0, remaining))}</span>
            </p>
            <p className={afterThis < 0 ? "text-red-700" : "text-muted-foreground"}>
              Setelah sub-pos ini: {formatRupiah(afterThis)}
              {afterThis < 0 && " — melebihi jatah induk"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-category">Nama Kategori Sub-pos</Label>
            <Input
              id="sub-category"
              value={form.category}
              placeholder="Contoh: Publikasi, Konsumsi"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-allocated">Alokasi (Rupiah)</Label>
            <Input
              id="sub-allocated"
              type="number"
              min={0}
              value={form.allocated_idr || ""}
              onChange={(e) => setForm({ ...form, allocated_idr: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">{formatRupiah(form.allocated_idr)}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-notes">Catatan</Label>
            <Textarea
              id="sub-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            />
          </div>

          {errorMessage && (
            <p className="whitespace-pre-line rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!valid || submitting} onClick={() => onSubmit(form)}>
            {submitting ? "Menyimpan..." : "Simpan Sub-pos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
