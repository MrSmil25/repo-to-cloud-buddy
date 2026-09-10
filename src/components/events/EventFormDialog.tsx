import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/useProfile";
import {
  EVENT_STATUSES,
  EVENT_STATUS_META,
  EVENT_TYPES,
  EVENT_TYPE_META,
  createEvent,
  slugify,
  updateEvent,
  uploadFile,
  type EventRow,
} from "@/lib/events";
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

export function EventFormDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: EventRow | null;
}) {
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useProfiles();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("Workshop");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [picId, setPicId] = useState("none");
  const [targetAttendees, setTargetAttendees] = useState("");
  const [actualAttendees, setActualAttendees] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<string>("Planning");
  const [notes, setNotes] = useState("");
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(event?.name ?? "");
    setSlug(event?.slug ?? "");
    setSlugTouched(!!event);
    setDescription(event?.description ?? "");
    setEventType(event?.event_type ?? "Workshop");
    setDateStart(event?.date_start ?? "");
    setDateEnd(event?.date_end ?? "");
    setVenue(event?.venue ?? "");
    setVenueAddress(event?.venue_address ?? "");
    setPicId(event?.pic_id ?? "none");
    setTargetAttendees(event?.target_attendees != null ? String(event.target_attendees) : "");
    setActualAttendees(event?.actual_attendees != null ? String(event.actual_attendees) : "");
    setBudget(event?.budget_idr != null ? String(event.budget_idr) : "");
    setStatus(event?.status ?? "Planning");
    setNotes(event?.notes ?? "");
    setPosterPath(event?.poster_url ?? null);
  }, [open, event]);

  function handleName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handlePoster(file: File) {
    setUploading(true);
    try {
      const path = await uploadFile("events", "posters", file);
      setPosterPath(path);
      toast.success("Poster terunggah");
    } catch (e) {
      toast.error("Gagal mengunggah poster: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama event wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: (slug || slugify(name)).trim(),
      description: description.trim() || null,
      event_type: eventType,
      date_start: dateStart || null,
      date_end: dateEnd || null,
      venue: venue.trim() || null,
      venue_address: venueAddress.trim() || null,
      pic_id: picId === "none" ? null : picId,
      target_attendees: targetAttendees ? Number(targetAttendees) : null,
      actual_attendees: actualAttendees ? Number(actualAttendees) : null,
      budget_idr: budget ? Number(budget) : null,
      status,
      poster_url: posterPath,
      notes: notes.trim() || null,
    };
    try {
      if (event) await updateEvent(event.id, payload);
      else await createEvent(payload);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      if (event) await queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast.success(event ? "Event diperbarui" : "Event dibuat");
      onOpenChange(false);
    } catch (err) {
      toast.error("Gagal menyimpan: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Buat Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-name">Nama Event *</Label>
              <Input id="ev-name" value={name} onChange={(e) => handleName(e.target.value)} required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-slug">Slug</Label>
              <Input
                id="ev-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-desc">Deskripsi</Label>
              <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EVENT_TYPE_META[t]?.label ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{EVENT_STATUS_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-start">Tanggal Mulai</Label>
              <Input id="ev-start" type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-end">Tanggal Selesai</Label>
              <Input id="ev-end" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-venue">Venue</Label>
              <Input id="ev-venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-venue-addr">Alamat Venue</Label>
              <Input id="ev-venue-addr" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
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
              <Label htmlFor="ev-target">Target Peserta</Label>
              <Input id="ev-target" type="number" min="0" value={targetAttendees} onChange={(e) => setTargetAttendees(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-budget">Budget Total (Rp)</Label>
              <Input id="ev-budget" type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            {event && (
              <div className="space-y-1.5">
                <Label htmlFor="ev-actual">Peserta Hadir</Label>
                <Input id="ev-actual" type="number" min="0" value={actualAttendees} onChange={(e) => setActualAttendees(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-poster">Poster</Label>
              <Input
                id="ev-poster"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handlePoster(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Mengunggah…" : posterPath ? "Poster tersimpan." : "Belum ada poster."}
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ev-notes">Catatan</Label>
              <Textarea id="ev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
