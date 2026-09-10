import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  type TransactionCategory,
} from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category?: TransactionCategory | null;
  nextOrder: number;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("Expense");
  const [color, setColor] = useState("#64748b");
  const [order, setOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? "Expense");
    setColor(category?.color_hex ?? "#64748b");
    setOrder(String(category?.sort_order ?? nextOrder));
    setActive(category?.is_active ?? true);
  }, [open, category, nextOrder]);

  async function save() {
    if (!name.trim()) { toast.error("Nama kategori wajib diisi"); return; }
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) { toast.error("Format warna harus hex, contoh #16a34a"); return; }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        type,
        color_hex: color,
        is_active: active,
        sort_order: Number(order) || 0,
      };
      if (category) await updateCategory(category.id, input);
      else await createCategory(input);
      await queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast.success(category ? "Kategori diperbarui" : "Kategori ditambahkan");
      onOpenChange(false);
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(
        msg.includes("duplicate") ? "Nama kategori sudah dipakai" : "Gagal menyimpan: " + msg,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sponsorship" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe *</Label>
            <RadioGroup value={type} onValueChange={setType} className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Income" /> Income</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Expense" /> Expense</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="Both" /> Both</label>
            </RadioGroup>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Warna</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-9 cursor-pointer rounded border bg-transparent p-0.5"
                  aria-label="Pilih warna"
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#16a34a" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Urutan</Label>
              <Input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} /> Aktif
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
