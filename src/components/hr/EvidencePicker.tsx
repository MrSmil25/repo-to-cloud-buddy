import { Checkbox } from "@/components/ui/checkbox";
import type { EvidenceItem } from "@/lib/warnings";

export function EvidencePicker({
  title,
  items,
  selected,
  onChange,
  emptyText,
  loading,
}: {
  title: string;
  items: EvidenceItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
  loading?: boolean;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-xs text-muted-foreground">{selected.length} dipilih</span>
      </div>
      <div className="max-h-52 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Memuat…</p>
        ) : items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-accent/40"
            >
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm">{item.label}</span>
                {item.sub && (
                  <span className="block text-xs text-muted-foreground">{item.sub}</span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
