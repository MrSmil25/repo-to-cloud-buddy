import { eventOptionLabel } from "@/lib/events";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BreakdownEditor } from "./BreakdownEditor";
import { formatRupiah } from "@/lib/format";
import {
  URGENCIES,
  URGENCY_LABEL,
  fetchEventOptions,
  type BreakdownItem,
  type NewFundRequest,
} from "@/lib/fund-requests";

const NONE = "__none__";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: NewFundRequest) => void;
  saving: boolean;
};

export function FundRequestFormDialog({ open, onOpenChange, onSubmit, saving }: Props) {
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [urgency, setUrgency] = useState<string>("Normal");
  const [eventId, setEventId] = useState<string>(NONE);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BreakdownItem[]>([]);

  const { data: events } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });

  const valid = purpose.trim().length > 0 && amount > 0;

  function submit() {
    if (!valid) return;
    onSubmit({
      purpose: purpose.trim(),
      amount_idr: Math.round(amount),
      urgency,
      breakdown: items.length ? items : null,
      event_id: eventId === NONE ? null : eventId,
      notes: notes.trim() || null,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setPurpose("");
          setAmount(0);
          setUrgency("Normal");
          setEventId(NONE);
          setNotes("");
          setItems([]);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Dana</DialogTitle>
          <DialogDescription>
            Untuk kebutuhan yang belum dibelanjakan. Nominal boleh berupa perkiraan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Perihal / Untuk apa *</Label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Konsumsi rapat besar bulan ini"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Jumlah Diminta *</Label>
              <Input
                type="number"
                min={0}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{formatRupiah(amount)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Urgensi</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCIES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {URGENCY_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <BreakdownEditor items={items} onChange={setItems} />

          <div className="space-y-1.5">
            <Label>Terkait Event (opsional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Tidak terkait event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tidak terkait event</SelectItem>
                {(events ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {eventOptionLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Menyimpan…" : "Kirim Pengajuan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
