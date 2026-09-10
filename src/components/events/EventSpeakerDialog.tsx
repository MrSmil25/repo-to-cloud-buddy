import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CONFIRMATION_META,
  CONFIRMATION_STATUSES,
  FEE_STATUSES,
  FEE_STATUS_LABELS,
  addEventSpeaker,
  fetchSpeakers,
  updateEventSpeaker,
  uploadFile,
  type EventSpeakerWithRelations,
} from "@/lib/events";
import { SpeakerFormDialog } from "@/components/speakers/SpeakerFormDialog";
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

export function EventSpeakerDialog({
  open,
  onOpenChange,
  eventId,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  entry?: EventSpeakerWithRelations | null;
}) {
  const queryClient = useQueryClient();
  const { data: speakers = [] } = useQuery({ queryKey: ["speakers"], queryFn: fetchSpeakers });

  const [speakerId, setSpeakerId] = useState("");
  const [search, setSearch] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [fee, setFee] = useState("");
  const [feeStatus, setFeeStatus] = useState<string>("Not_Applicable");
  const [confirmation, setConfirmation] = useState<string>("Invited");
  const [torPath, setTorPath] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSpeakerOpen, setNewSpeakerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSpeakerId(entry?.speaker_id ?? "");
    setSearch("");
    setSessionTitle(entry?.session_title ?? "");
    setStart(toLocalInput(entry?.session_time_start));
    setEnd(toLocalInput(entry?.session_time_end));
    setFee(entry?.fee_idr != null ? String(entry.fee_idr) : "");
    setFeeStatus(entry?.fee_status ?? "Not_Applicable");
    setConfirmation(entry?.confirmation_status ?? "Invited");
    setTorPath(entry?.tor_url ?? null);
    setNotes(entry?.notes ?? "");
  }, [open, entry]);

  const filteredSpeakers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return speakers;
    return speakers.filter(
      (s) =>
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.expertise ?? "").toLowerCase().includes(q),
    );
  }, [speakers, search]);

  function handleSpeakerChange(value: string) {
    setSpeakerId(value);
    const s = speakers.find((x) => x.id === value);
    if (s?.default_rate_idr != null && !fee) setFee(String(s.default_rate_idr));
  }

  async function handleTor(file: File) {
    setUploading(true);
    try {
      const path = await uploadFile("documents", "tor", file);
      setTorPath(path);
      toast.success("ToR terunggah");
    } catch (e) {
      toast.error("Gagal mengunggah ToR: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!speakerId) {
      toast.error("Pilih speaker terlebih dahulu");
      return;
    }
    setSaving(true);
    const payload = {
      event_id: eventId,
      speaker_id: speakerId,
      session_title: sessionTitle.trim() || null,
      session_time_start: start ? new Date(start).toISOString() : null,
      session_time_end: end ? new Date(end).toISOString() : null,
      fee_idr: fee ? Number(fee) : null,
      fee_status: feeStatus,
      confirmation_status: confirmation,
      tor_url: torPath,
      notes: notes.trim() || null,
    };
    try {
      if (entry) await updateEventSpeaker(entry.id, payload);
      else await addEventSpeaker(payload);
      await queryClient.invalidateQueries({ queryKey: ["event-speakers", eventId] });
      await queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
      toast.success(entry ? "Data speaker diperbarui" : "Speaker ditambahkan ke event");
      onOpenChange(false);
    } catch (err) {
      toast.error("Gagal menyimpan: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{entry ? "Edit Speaker Event" : "Tambah Speaker ke Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Speaker *</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau keahlian…"
              />
              <div className="flex gap-2">
                <Select value={speakerId} onValueChange={handleSpeakerChange}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih speaker" /></SelectTrigger>
                  <SelectContent>
                    {filteredSpeakers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                        {s.expertise ? ` — ${s.expertise}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setNewSpeakerOpen(true)}>
                  + Buat Speaker Baru
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="es-title">Judul Sesi</Label>
                <Input id="es-title" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="es-start">Waktu Mulai</Label>
                <Input id="es-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="es-end">Waktu Selesai</Label>
                <Input id="es-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="es-fee">Fee (Rp)</Label>
                <Input id="es-fee" type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status Fee</Label>
                <Select value={feeStatus} onValueChange={setFeeStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEE_STATUSES.map((f) => (
                      <SelectItem key={f} value={f}>{FEE_STATUS_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status Konfirmasi</Label>
                <Select value={confirmation} onValueChange={setConfirmation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONFIRMATION_STATUSES.map((c) => (
                      <SelectItem key={c} value={c}>{CONFIRMATION_META[c]?.label ?? c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="es-tor">Upload ToR</Label>
                <Input
                  id="es-tor"
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleTor(f);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {uploading ? "Mengunggah…" : torPath ? "ToR tersimpan." : "Belum ada ToR."}
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="es-notes">Catatan</Label>
                <Textarea id="es-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={saving || uploading}>{saving ? "Menyimpan…" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SpeakerFormDialog
        open={newSpeakerOpen}
        onOpenChange={setNewSpeakerOpen}
        onCreated={(s) => handleSpeakerChange(s.id)}
      />
    </>
  );
}
