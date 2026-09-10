import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/useProfile";
import { createRundown, updateRundown, type RundownItem } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RundownFormDialog({
  open,
  onOpenChange,
  eventId,
  item,
  defaultDate,
  nextSortOrder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  item?: RundownItem | null;
  defaultDate?: string | null;
  nextSortOrder: number;
}) {
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useProfiles();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [activity, setActivity] = useState("");
  const [picId, setPicId] = useState("none");
  const [notes, setNotes] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prefill = defaultDate ? `${defaultDate}T09:00` : "";
    setStart(item ? toLocalInput(item.time_start) : prefill);
    setEnd(item ? toLocalInput(item.time_end) : prefill);
    setActivity(item?.activity ?? "");
    setPicId(item?.pic_id ?? "none");
    setNotes(item?.notes ?? "");
    setSortOrder(String(item?.sort_order ?? nextSortOrder));
  }, [open, item, defaultDate, nextSortOrder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activity.trim()) {
      toast.error("Aktivitas wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      event_id: eventId,
      time_start: start ? new Date(start).toISOString() : null,
      time_end: end ? new Date(end).toISOString() : null,
      activity: activity.trim(),
      pic_id: picId === "none" ? null : picId,
      notes: notes.trim() || null,
      sort_order: Number(sortOrder) || 0,
    };
    try {
      if (item) await updateRundown(item.id, payload);
      else await createRundown(payload);
      await queryClient.invalidateQueries({ queryKey: ["event-rundown", eventId] });
      toast.success(item ? "Item rundown diperbarui" : "Item rundown ditambahkan");
      onOpenChange(false);
    } catch (err) {
      toast.error("Gagal menyimpan: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item Rundown" : "Tambah Item Rundown"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rd-start">Waktu Mulai</Label>
              <Input id="rd-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-end">Waktu Selesai</Label>
              <Input id="rd-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rd-activity">Aktivitas *</Label>
              <Input id="rd-activity" value={activity} onChange={(e) => setActivity(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>PIC</Label>
              <Select value={picId} onValueChange={setPicId}>
                <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-order">Urutan</Label>
              <Input id="rd-order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rd-notes">Catatan</Label>
              <Textarea id="rd-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
