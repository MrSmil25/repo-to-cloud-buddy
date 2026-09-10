import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL } from "@/lib/workspace";
import type { NewHelpRequest } from "@/lib/help-requests";

type Option = { id: string; label: string };

const STEPS = ["Divisi tujuan", "Detail task", "Assignee & event", "Konfirmasi"];

export function HelpRequestWizard({
  open,
  onOpenChange,
  divisions,
  members,
  events,
  myDivision,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  divisions: { code: string; name: string }[];
  members: { id: string; full_name: string; role: string | null; division: string | null }[];
  events: Option[];
  myDivision: string | null;
  submitting?: boolean | undefined;
  onSubmit: (input: NewHelpRequest) => void;
}) {
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setTarget("");
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setAssignee("");
      setEventId("");
    }
  }, [open]);

  const targetDivisions = divisions.filter((d) => d.code !== myDivision);
  const candidates = useMemo(
    () => members.filter((m) => m.division === target && m.role === "Anggota"),
    [members, target],
  );
  const targetName = divisions.find((d) => d.code === target)?.name ?? target;

  const canNext =
    (step === 0 && !!target) || (step === 1 && title.trim().length > 2) || step === 2 || step === 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Butuh bantuan divisi lain?</DialogTitle>
          <DialogDescription>
            Langkah {step + 1} dari {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Divisi tujuan</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Pilih divisi…</option>
              {targetDivisions.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Judul task</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Desain poster acara open recruitment"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Deskripsi (opsional)</label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan konteksnya biar divisi tujuan paham."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Prioritas</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {TASK_PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tenggat (opsional)</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Usulan pelaksana (opsional)</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Serahkan ke Kadiv</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Kadiv target boleh mengganti pilihan ini.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Event terkait (opsional)</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">Tidak ada</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground">
              Untuk divisi {targetName} · Prioritas {TASK_PRIORITY_LABEL[priority] ?? priority}
              {dueDate ? ` · Tenggat ${dueDate}` : ""}
            </p>
            {description && <p className="text-muted-foreground">{description}</p>}
            <p className="text-muted-foreground">
              Request ini akan diputuskan Kadiv {targetName}. Otomatis ditolak dalam 3 hari kalau
              tidak diputuskan.
            </p>
          </div>
        )}

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Kembali
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Lanjut
            </Button>
          ) : (
            <Button
              disabled={submitting || !target || title.trim().length < 3}
              onClick={() =>
                onSubmit({
                  target_division: target,
                  task_title: title.trim(),
                  task_description: description.trim() || null,
                  priority,
                  due_date: dueDate || null,
                  suggested_assignee_id: assignee || null,
                  related_event_id: eventId || null,
                })
              }
            >
              Kirim request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
