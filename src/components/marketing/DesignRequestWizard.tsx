import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProfile } from "@/hooks/useProfile";
import { fetchEvents } from "@/lib/events";
import {
  DESIGN_TYPES,
  PRIORITIES,
  createDesignRequest,
  createDesignRequestFromContent,
  daysFromToday,
  label,
  type ContentPlan,
  type DesignType,
  type Priority,
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

const TYPE_BY_FORMAT: Record<string, DesignType> = {
  Feed_Tunggal: "Feed_IG",
  Carousel: "Carousel",
  Story: "Story_IG",
  Reels: "Lainnya",
  Artikel: "Banner",
};

export function DesignRequestWizard({
  open,
  onOpenChange,
  fromContent,
  defaultEventId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromContent?: ContentPlan | null;
  defaultEventId?: string | null;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: () => fetchEvents() });

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [designType, setDesignType] = useState<DesignType>("Poster");
  const [brief, setBrief] = useState("");
  const [reference, setReference] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [eventId, setEventId] = useState(NONE);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTitle(fromContent ? `Desain: ${fromContent.title}` : "");
    setDesignType(
      fromContent ? (TYPE_BY_FORMAT[fromContent.format] ?? "Poster") : "Poster",
    );
    setBrief(fromContent?.brief ?? "");
    setReference("");
    setNeededBy(fromContent?.scheduled_date ?? "");
    setPriority("Medium");
    setEventId(fromContent?.related_event_id ?? defaultEventId ?? NONE);
  }, [open, fromContent?.id, defaultEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sisa = daysFromToday(neededBy);
  const suggested: Priority | null = useMemo(() => {
    if (sisa === null) return null;
    if (sisa <= 1) return "Critical";
    if (sisa <= 3) return "High";
    if (sisa <= 7) return "Medium";
    return "Low";
  }, [sisa]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (fromContent) {
        await createDesignRequestFromContent({
          contentId: fromContent.id,
          designType,
          neededBy: neededBy || null,
          extraBrief: [brief.trim(), reference.trim() ? `Referensi: ${reference.trim()}` : ""]
            .filter(Boolean)
            .join("\n\n"),
        });
        return;
      }
      await createDesignRequest({
        title: title.trim(),
        brief: brief.trim(),
        design_type: designType,
        priority,
        needed_by: neededBy,
        reference_notes: reference.trim() || null,
        related_event_id: eventId === NONE ? null : eventId,
        requester_division: profile?.division ?? null,
      });
    },
    onSuccess: () => {
      for (const key of [
        "design-requests",
        "content-designs",
        "content-plans",
        "content-plan",
        "event-design-requests",
        "design-workload",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Permintaan desain dikirim ke antrean.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Gagal mengirim: " + e.message),
  });

  function next() {
    if (step === 1 && !title.trim()) {
      toast.error("Judul permintaan wajib diisi.");
      return;
    }
    if (step === 2 && brief.trim().length < 10) {
      toast.error("Brief minimal 10 karakter supaya desainer paham.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  const activeEvents = events.filter((e: { status?: string | null }) =>
    ["Planning", "Preparation", "Live"].includes(e.status ?? ""),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Minta Desain — Langkah {step} dari 3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dr-title">Mau desain apa? *</Label>
              <Input
                id="dr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Poster open recruitment"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Desain</Label>
              <Select value={designType} onValueChange={(v) => setDesignType(v as DesignType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DESIGN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{label(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!fromContent && (
              <div className="space-y-1.5">
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
            )}
            {fromContent && (
              <p className="rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground">
                Terhubung dengan konten “{fromContent.title}”. Status konten otomatis jadi Perlu Desain.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dr-brief">Brief: isi teks, suasana, dan tujuan *</Label>
              <Textarea
                id="dr-brief"
                rows={6}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Teks utama, warna, nuansa, siapa yang dituju…"
              />
              <p className="text-xs text-muted-foreground">{brief.trim().length} karakter</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dr-ref">Referensi (link atau catatan)</Label>
              <Textarea
                id="dr-ref"
                rows={2}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Link contoh desain, palet warna, dsb."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dr-date">Dibutuhkan tanggal *</Label>
              <Input
                id="dr-date"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
              {sisa !== null && (
                <p className="text-xs text-muted-foreground">
                  {sisa < 0
                    ? "Tanggal sudah lewat."
                    : `Sisa ${sisa} hari untuk desainer mengerjakan.`}
                </p>
              )}
            </div>
            {!fromContent && (
              <div className="space-y-1.5">
                <Label>Prioritas</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suggested && suggested !== priority && (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary underline"
                    onClick={() => setPriority(suggested)}
                  >
                    Saran berdasarkan tenggat: {suggested} — pakai saran ini
                  </button>
                )}
              </div>
            )}
            <div className="rounded-lg border bg-muted/50 p-3 text-xs">
              <p className="font-semibold">Ringkasan</p>
              <p>{title || "-"}</p>
              <p className="text-muted-foreground">{label(designType)}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Kembali</Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>Lanjut</Button>
          ) : (
            <Button
              disabled={mutation.isPending}
              onClick={() => {
                if (!neededBy) {
                  toast.error("Tanggal dibutuhkan wajib diisi.");
                  return;
                }
                mutation.mutate();
              }}
            >
              Kirim Permintaan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
