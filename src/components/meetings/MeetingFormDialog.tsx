import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/lib/supabase-external";
import { useDivisions, useProfiles, useMyProfile } from "@/hooks/useProfile";
import {
  MEETING_TYPES,
  MEETING_TYPE_LABEL,
  type MeetingType,
  type NewMeeting,
} from "@/lib/meetings";

function useEvents() {
  return useQuery({
    queryKey: ["events-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .order("date_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function MeetingFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  initial,
  title = "Buat Rapat",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewMeeting) => void;
  submitting?: boolean;
  initial?: Partial<NewMeeting>;
  title?: string;
}) {
  const { data: profile } = useMyProfile();
  const { data: profiles } = useProfiles();
  const { data: divisions } = useDivisions();
  const { data: events } = useEvents();

  const [form, setForm] = useState<NewMeeting>({
    title: "",
    meeting_type: "Rapat_Besar",
    meeting_date: "",
    location: null,
    division: null,
    related_event_id: null,
    agenda: null,
    led_by: null,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initial?.title ?? "",
      meeting_type: (initial?.meeting_type as MeetingType) ?? "Rapat_Besar",
      meeting_date: initial?.meeting_date
        ? new Date(initial.meeting_date).toISOString().slice(0, 16)
        : "",
      location: initial?.location ?? null,
      division: initial?.division ?? null,
      related_event_id: initial?.related_event_id ?? null,
      agenda: initial?.agenda ?? null,
      led_by: initial?.led_by ?? profile?.id ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profile?.id]);

  const valid = form.title.trim().length > 0 && form.meeting_date.length > 0;

  function submit() {
    if (!valid) return;
    onSubmit({
      ...form,
      title: form.title.trim(),
      meeting_date: new Date(form.meeting_date).toISOString(),
      division: form.meeting_type === "Rapat_Divisi" ? form.division : null,
      related_event_id: form.meeting_type === "Rapat_Event" ? form.related_event_id : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Catat jadwal rapat beserta agenda dan pemimpinnya.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">Judul *</Label>
            <Input
              id="meeting-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Rapat evaluasi bulanan"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipe Rapat</Label>
              <Select
                value={form.meeting_type}
                onValueChange={(v) => setForm((f) => ({ ...f, meeting_type: v as MeetingType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MEETING_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting-date">Tanggal & Waktu *</Label>
              <Input
                id="meeting-date"
                type="datetime-local"
                value={form.meeting_date}
                onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-location">Lokasi</Label>
            <Input
              id="meeting-location"
              value={form.location ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))}
              placeholder="Ruang rapat / Zoom"
            />
          </div>

          {form.meeting_type === "Rapat_Divisi" && (
            <div className="space-y-1.5">
              <Label>Divisi</Label>
              <Select
                value={form.division ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, division: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {(divisions ?? []).map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.meeting_type === "Rapat_Event" && (
            <div className="space-y-1.5">
              <Label>Event Terkait</Label>
              <Select
                value={form.related_event_id ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, related_event_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih event" />
                </SelectTrigger>
                <SelectContent>
                  {(events ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="meeting-agenda">Agenda</Label>
            <Textarea
              id="meeting-agenda"
              rows={4}
              value={form.agenda ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value || null }))}
              placeholder="1. Pembukaan&#10;2. Evaluasi program"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Dipimpin Oleh</Label>
            <Select
              value={form.led_by ?? ""}
              onValueChange={(v) => setForm((f) => ({ ...f, led_by: v }))}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid || submitting}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
