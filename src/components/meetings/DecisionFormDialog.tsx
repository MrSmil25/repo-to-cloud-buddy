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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles } from "@/hooks/useProfile";

export type DecisionFormValue = {
  decision: string;
  pic_id: string | null;
  due_date: string | null;
  makeTask: boolean;
};

export function DecisionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: DecisionFormValue) => void;
  submitting?: boolean;
}) {
  const { data: profiles } = useProfiles();
  const [form, setForm] = useState<DecisionFormValue>({
    decision: "",
    pic_id: null,
    due_date: null,
    makeTask: false,
  });

  useEffect(() => {
    if (open) setForm({ decision: "", pic_id: null, due_date: null, makeTask: false });
  }, [open]);

  const valid = form.decision.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Keputusan</DialogTitle>
          <DialogDescription>Catat hasil keputusan rapat dan penanggung jawabnya.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="decision-text">Keputusan *</Label>
            <Textarea
              id="decision-text"
              rows={3}
              value={form.decision}
              onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value }))}
              placeholder="Menyiapkan proposal sponsor sebelum akhir bulan"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>PIC</Label>
              <Select
                value={form.pic_id ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, pic_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  {(profiles ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="decision-due">Due Date</Label>
              <Input
                id="decision-due"
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value || null }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.makeTask}
              onCheckedChange={(c) => setForm((f) => ({ ...f, makeTask: c === true }))}
            />
            Langsung jadikan task
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => valid && onSubmit(form)} disabled={!valid || submitting}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
