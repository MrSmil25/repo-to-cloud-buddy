import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/format";
import type { BreakdownItem } from "@/lib/fund-requests";

type Props = {
  items: BreakdownItem[];
  onChange: (items: BreakdownItem[]) => void;
};

export function BreakdownEditor({ items, onChange }: Props) {
  function update(index: number, patch: Partial<BreakdownItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  const total = items.reduce((a, it) => a + Number(it.qty || 0) * Number(it.unit_price || 0), 0);

  return (
    <div className="space-y-2">
      <Label>Rincian (opsional)</Label>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Belum ada rincian. Disarankan mengisi agar mudah diverifikasi.
        </p>
      )}
      {items.map((it, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Nama item"
              value={it.item}
              onChange={(e) => update(i, { item: e.target.value })}
            />
          </div>
          <div className="w-16">
            <Input
              type="number"
              min={0}
              placeholder="Qty"
              value={it.qty || ""}
              onChange={(e) => update(i, { qty: Number(e.target.value) })}
            />
          </div>
          <div className="w-32">
            <Input
              type="number"
              min={0}
              placeholder="Harga satuan"
              value={it.unit_price || ""}
              onChange={(e) => update(i, { unit_price: Number(e.target.value) })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            aria-label="Hapus baris"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { item: "", qty: 1, unit_price: 0 }])}
        >
          <Plus className="size-4" /> Tambah Rincian
        </Button>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Total rincian: <strong>{formatRupiah(total)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
