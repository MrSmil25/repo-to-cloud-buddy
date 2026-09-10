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
import { COACHING_TOPICS, COACHING_TOPIC_LABEL } from "@/lib/hr";
import type { Profile } from "@/hooks/useProfile";

export type CoachingFormValue = {
  member_id: string;
  topic: string;
  discussion: string;
  agreements: string | null;
  next_checkin: string | null;
};

export function CoachingFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  candidates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: CoachingFormValue) => void;
  submitting?: boolean;
  candidates: Profile[];
}) {
  const [form, setForm] = useState<CoachingFormValue>({
    member_id: "",
    topic: "Reguler",
    discussion: "",
    agreements: "",
    next_checkin: "",
  });

  useEffect(() => {
    if (open)
      setForm({
        member_id: "",
        topic: "Reguler",
        discussion: "",
        agreements: "",
        next_checkin: "",
      });
  }, [open]);

  const valid = form.member_id !== "" && form.discussion.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Catat Sesi Bimbingan</DialogTitle>
          <DialogDescription>
            Catatan ini bisa dibaca anggota yang bersangkutan. Tulis dengan nada membangun.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Anggota *</Label>
            <Select
              value={form.member_id}
              onValueChange={(v) => setForm((f) => ({ ...f, member_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih anggota" />
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
            <Label>Topik</Label>
            <Select value={form.topic} onValueChange={(v) => setForm((f) => ({ ...f, topic: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COACHING_TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {COACHING_TOPIC_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-discussion">Yang Dibahas *</Label>
            <Textarea
              id="coach-discussion"
              rows={4}
              value={form.discussion}
              onChange={(e) => setForm((f) => ({ ...f, discussion: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-agreements">Kesepakatan</Label>
            <Textarea
              id="coach-agreements"
              rows={3}
              value={form.agreements ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, agreements: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-checkin">Check-in Berikutnya</Label>
            <Input
              id="coach-checkin"
              type="date"
              value={form.next_checkin ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, next_checkin: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={!valid || submitting}
            onClick={() =>
              onSubmit({
                ...form,
                agreements: form.agreements?.trim() ? form.agreements.trim() : null,
                next_checkin: form.next_checkin ? form.next_checkin : null,
              })
            }
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
