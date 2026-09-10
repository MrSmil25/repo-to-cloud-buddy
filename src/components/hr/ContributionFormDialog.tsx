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
import { CONTRIBUTION_KINDS, CONTRIBUTION_KIND_LABEL } from "@/lib/hr";
import type { Profile } from "@/hooks/useProfile";
import type { OptionRow } from "@/lib/workspace";

export type ContributionFormValue = {
  member_id: string;
  kind: string;
  description: string;
  related_event_id: string | null;
  related_task_id: string | null;
  visible_to_member: boolean;
};

export function ContributionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  candidates,
  events = [],
  tasks = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: ContributionFormValue) => void;
  submitting?: boolean;
  candidates: Profile[];
  events?: OptionRow[];
  tasks?: OptionRow[];
}) {
  const [form, setForm] = useState<ContributionFormValue>({
    member_id: "",
    kind: "Membantu_Rekan",
    description: "",
    related_event_id: null,
    related_task_id: null,
    visible_to_member: true,
  });

  useEffect(() => {
    if (open)
      setForm({
        member_id: "",
        kind: "Membantu_Rekan",
        description: "",
        related_event_id: null,
        related_task_id: null,
        visible_to_member: true,
      });
  }, [open]);

  const valid = form.member_id !== "" && form.description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apresiasi Rekan</DialogTitle>
          <DialogDescription>
            Catat kontribusi baik rekan Anda supaya usahanya terlihat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Anggota yang Diapresiasi *</Label>
            <Select
              value={form.member_id}
              onValueChange={(v) => setForm((f) => ({ ...f, member_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih rekan" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                    {p.division ? ` — ${p.division}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Jenis Kontribusi</Label>
            <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRIBUTION_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {CONTRIBUTION_KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contrib-desc">Deskripsi *</Label>
            <Textarea
              id="contrib-desc"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Membantu menyiapkan rundown acara sampai larut malam."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Event Terkait</Label>
              <Select
                value={form.related_event_id ?? "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, related_event_id: v === "none" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tidak ada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Task Terkait</Label>
              <Select
                value={form.related_task_id ?? "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, related_task_id: v === "none" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tidak ada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.visible_to_member}
              onCheckedChange={(v) => setForm((f) => ({ ...f, visible_to_member: v === true }))}
            />
            Tampilkan ke anggota yang diapresiasi
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!valid || submitting} onClick={() => onSubmit(form)}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
