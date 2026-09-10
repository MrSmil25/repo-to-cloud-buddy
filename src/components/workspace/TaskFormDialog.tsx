import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL, type NewTaskInput, type OptionRow } from "@/lib/workspace";

const NONE = "__none__";

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
  options,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: Omit<NewTaskInput, "assignee_id" | "division">) => void;
  saving: boolean;
  options: { keyResults: OptionRow[]; events: OptionRow[]; deals: OptionRow[] } | undefined;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [krId, setKrId] = useState(NONE);
  const [eventId, setEventId] = useState(NONE);
  const [dealId, setDealId] = useState(NONE);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setIsPrivate(false);
      setKrId(NONE);
      setEventId(NONE);
      setDealId(NONE);
    }
  }, [open]);

  function handlePrivateChange(checked: boolean) {
    setIsPrivate(checked);
    if (checked) {
      setKrId(NONE);
      setEventId(NONE);
      setDealId(NONE);
    }
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
      is_private: isPrivate,
      key_result_id: isPrivate || krId === NONE ? null : krId,
      related_event_id: isPrivate || eventId === NONE ? null : eventId,
      related_deal_id: isPrivate || dealId === NONE ? null : dealId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Task Baru</DialogTitle>
          <DialogDescription>
            Task ini otomatis ditugaskan ke diri Anda sendiri.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Judul *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Susun proposal sponsor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Deskripsi</Label>
            <Textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Tenggat</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={(v) => handlePrivateChange(v === true)}
            />
            <span className="text-sm">
              <span className="font-medium">Task Privat</span>
              <span className="block text-xs text-muted-foreground">
                Hanya saya yang bisa lihat task ini.
              </span>
            </span>
          </label>

          {isPrivate ? (
            <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              Task privat tidak bisa dikaitkan ke KR, Event, atau Deal.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Terkait Key Result</Label>
                <Select value={krId} onValueChange={setKrId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tidak ada</SelectItem>
                    {(options?.keyResults ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Terkait Event</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tidak ada</SelectItem>
                    {(options?.events ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Terkait Deal</Label>
                <Select value={dealId} onValueChange={setDealId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tidak ada</SelectItem>
                    {(options?.deals ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? "Menyimpan…" : "Simpan Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
