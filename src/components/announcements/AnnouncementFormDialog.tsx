import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDivisions } from "@/hooks/useProfile";
import {
  ANNOUNCEMENT_LEVELS,
  fetchActiveEvents,
  type Announcement,
  type AnnouncementInput,
} from "@/lib/announcements";

const NO_EVENT = "__none__";

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  editing,
  isBPH,
  myDivision,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Announcement | null;
  isBPH: boolean;
  myDivision: string | null;
  onSubmit: (input: AnnouncementInput) => void;
  saving: boolean;
}) {
  const { data: divisions = [] } = useDivisions();
  const { data: events = [] } = useQuery({
    queryKey: ["announcement-events"],
    queryFn: fetchActiveEvents,
    enabled: open,
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<string>("Info");
  const [scope, setScope] = useState<string>(isBPH ? "Organisasi" : "Divisi");
  const [targetDivision, setTargetDivision] = useState<string>(myDivision ?? "");
  const [eventId, setEventId] = useState<string>(NO_EVENT);
  const [requiresAck, setRequiresAck] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(editing?.title ?? "");
    setBody(editing?.body ?? "");
    setLevel(editing?.level ?? "Info");
    setScope(editing?.scope ?? (isBPH ? "Organisasi" : "Divisi"));
    setTargetDivision(editing?.target_division ?? myDivision ?? "");
    setEventId(editing?.related_event_id ?? NO_EVENT);
    setRequiresAck(!!editing?.requires_ack);
    setExpiresAt(editing?.expires_at ?? "");
  }, [open, editing, isBPH, myDivision]);

  function submit() {
    if (!title.trim() || !body.trim()) {
      setError("Judul dan isi pengumuman wajib diisi.");
      return;
    }
    const finalScope = isBPH ? scope : "Divisi";
    const finalDivision =
      finalScope === "Divisi" ? (isBPH ? targetDivision || myDivision : myDivision) : null;
    if (finalScope === "Divisi" && !finalDivision) {
      setError("Pilih divisi tujuan pengumuman.");
      return;
    }
    onSubmit({
      title: title.trim(),
      body: body.trim(),
      level,
      scope: finalScope,
      target_division: finalDivision ?? null,
      related_event_id: eventId === NO_EVENT ? null : eventId,
      requires_ack: requiresAck,
      expires_at: expiresAt || null,
    });
  }

  const divisionName = divisions.find((d) => d.code === myDivision)?.name ?? myDivision ?? "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Pengumuman" : "Buat Pengumuman"}</DialogTitle>
          <DialogDescription>
            Pengumuman akan tampil di halaman Pengumuman anggota sesuai cakupannya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Judul</Label>
            <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-body">Isi</Label>
            <Textarea id="a-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cakupan</Label>
              {isBPH ? (
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Organisasi">Organisasi</SelectItem>
                    <SelectItem value="Divisi">Divisi</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={`Divisi ${divisionName}`} readOnly disabled />
              )}
            </div>
          </div>

          {isBPH && scope === "Divisi" && (
            <div className="space-y-1.5">
              <Label>Divisi tujuan</Label>
              <Select value={targetDivision} onValueChange={setTargetDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Event terkait (opsional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Tanpa event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EVENT}>Tanpa event</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="a-ack"
              checked={requiresAck}
              onCheckedChange={(v) => setRequiresAck(v === true)}
            />
            <Label htmlFor="a-ack" className="font-normal">
              Perlu konfirmasi baca dari anggota
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="a-exp">Berlaku sampai (opsional)</Label>
            <Input
              id="a-exp"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
