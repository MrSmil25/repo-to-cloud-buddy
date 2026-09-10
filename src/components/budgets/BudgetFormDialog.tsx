import { eventOptionLabel } from "@/lib/events";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useDivisions } from "@/hooks/useProfile";
import { fetchEventOptions } from "@/lib/deals";
import { formatRupiah } from "@/lib/format";
import type { BudgetRow } from "@/lib/budgets";

export type ParentBudgetValue = {
  period: string;
  category: string;
  division: string | null;
  event_id: string | null;
  allocated_idr: number;
  notes: string | null;
};

export function BudgetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  errorMessage,
  initial,
  defaultPeriod,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: ParentBudgetValue) => void;
  submitting?: boolean;
  errorMessage?: string | null;
  initial?: BudgetRow | null;
  defaultPeriod: string;
}) {
  const { data: divisions } = useDivisions();
  const { data: events } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });
  const [scope, setScope] = useState<"division" | "event">("division");
  const [form, setForm] = useState<ParentBudgetValue>({
    period: defaultPeriod,
    category: "",
    division: null,
    event_id: null,
    allocated_idr: 0,
    notes: null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      period: initial?.period ?? defaultPeriod,
      category: initial?.category ?? "",
      division: initial?.division ?? null,
      event_id: initial?.event_id ?? null,
      allocated_idr: Number(initial?.allocated_idr ?? 0),
      notes: initial?.notes ?? null,
    });
    setScope(initial?.event_id ? "event" : "division");
  }, [open, initial, defaultPeriod]);

  const valid = form.category.trim().length > 0 && form.allocated_idr > 0 && !!form.period.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Budget Induk" : "Buat Budget Induk"}</DialogTitle>
          <DialogDescription>
            Budget induk adalah pagu besar yang nanti dipecah menjadi sub-pos oleh Kadiv.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget-period">Periode</Label>
            <Input
              id="budget-period"
              value={form.period}
              placeholder="Contoh: Kepengurusan 2026"
              onChange={(e) => setForm({ ...form, period: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-category">Nama Kategori</Label>
            <Input
              id="budget-category"
              value={form.category}
              placeholder="Contoh: Operasional Divisi Media"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Scope Budget</Label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="budget-scope"
                  checked={scope === "division"}
                  onChange={() => {
                    setScope("division");
                    setForm({ ...form, event_id: null });
                  }}
                />
                Per Divisi
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="budget-scope"
                  checked={scope === "event"}
                  onChange={() => {
                    setScope("event");
                    setForm({ ...form, division: null });
                  }}
                />
                Per Event
              </label>
            </div>
          </div>

          {scope === "event" ? (
            <div className="space-y-1.5">
              <Label>Event</Label>
              <Select
                value={form.event_id ?? "__none"}
                onValueChange={(v) => setForm({ ...form, event_id: v === "__none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Belum dipilih</SelectItem>
                  {(events ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {eventOptionLabel(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
          <div className="space-y-1.5">
            <Label>Divisi Pemilik</Label>
            <Select
              value={form.division ?? "__none"}
              onValueChange={(v) => setForm({ ...form, division: v === "__none" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Organisasi (tanpa divisi)</SelectItem>
                {(divisions ?? []).map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="budget-allocated">Alokasi (Rupiah)</Label>
            <Input
              id="budget-allocated"
              type="number"
              min={0}
              value={form.allocated_idr || ""}
              onChange={(e) => setForm({ ...form, allocated_idr: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">{formatRupiah(form.allocated_idr)}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-notes">Catatan</Label>
            <Textarea
              id="budget-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            />
          </div>

          {errorMessage && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800">{errorMessage}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!valid || submitting} onClick={() => onSubmit(form)}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
