import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import { fetchEvents } from "@/lib/events";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  FORMATS_BY_PLATFORM,
  createContentPlan,
  fetchPillars,
  label,
  type ContentFormat,
  type ContentPlatform,
  type ContentStatus,
} from "@/lib/marketing";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

const NONE = "__none__";

export function ContentFormDialog({
  open,
  onOpenChange,
  defaultEventId,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEventId?: string | null;
  defaultDate?: string | null;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const { data: pillars = [] } = useQuery({ queryKey: ["content-pillars"], queryFn: fetchPillars });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => fetchEvents() });

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<ContentPlatform>("Instagram");
  const [format, setFormat] = useState<ContentFormat>("Feed_Tunggal");
  const [pillarId, setPillarId] = useState(NONE);
  const [division, setDivision] = useState(NONE);
  const [copywriter, setCopywriter] = useState(NONE);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [eventId, setEventId] = useState(NONE);
  const [status, setStatus] = useState<ContentStatus>("Ide");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBrief("");
    setPlatform("Instagram");
    setFormat("Feed_Tunggal");
    setPillarId(NONE);
    setDivision(profile?.division ?? NONE);
    setCopywriter(profile?.id ?? NONE);
    setDate(defaultDate ?? "");
    setTime("");
    setEventId(defaultEventId ?? NONE);
    setStatus("Ide");
  }, [open, profile?.division, profile?.id, defaultEventId, defaultDate]);

  const formats = FORMATS_BY_PLATFORM[platform] ?? [];
  useEffect(() => {
    if (formats.length && !formats.includes(format)) setFormat(formats[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const activeEvents = events.filter((e: { status?: string | null }) =>
    ["Planning", "Preparation", "Live"].includes(e.status ?? ""),
  );

  const mutation = useMutation({
    mutationFn: () =>
      createContentPlan({
        title: title.trim(),
        brief: brief.trim() || null,
        platform,
        format,
        pillar_id: pillarId === NONE ? null : pillarId,
        owner_division: division === NONE ? null : division,
        copywriter_id: copywriter === NONE ? null : copywriter,
        scheduled_date: date || null,
        scheduled_time: time || null,
        related_event_id: eventId === NONE ? null : eventId,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-plans"] });
      queryClient.invalidateQueries({ queryKey: ["event-content-plans"] });
      toast.success("Rencana konten dibuat.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Gagal menyimpan: " + e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rencana Konten Baru</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ct-title">Judul *</Label>
            <Input
              id="ct-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Carousel tips manajemen waktu"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ct-brief">Brief / apa isi konten</Label>
            <Textarea id="ct-brief" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ContentPlatform)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ContentFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f} value={f}>{label(f)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Pilar Konten</Label>
            <Select value={pillarId} onValueChange={setPillarId}>
              <SelectTrigger><SelectValue placeholder="Pilih pilar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tanpa pilar</SelectItem>
                {pillars.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full border"
                        style={{ backgroundColor: p.color_hex ?? "transparent" }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Divisi Pemilik</Label>
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tanpa divisi</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Copywriter</Label>
            <Select value={copywriter} onValueChange={setCopywriter}>
              <SelectTrigger><SelectValue placeholder="Pilih anggota" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Belum ditentukan</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status Awal</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-date">Tanggal Tayang</Label>
            <Input id="ct-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ct-time">Waktu Tayang</Label>
            <Input id="ct-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Kosongkan kalau belum tahu jam pastinya.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Event Terkait</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder="Tanpa event" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tanpa event</SelectItem>
                {activeEvents.map((e: { id: string; name: string }) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error("Judul wajib diisi.");
                return;
              }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
