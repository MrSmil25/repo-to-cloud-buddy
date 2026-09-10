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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfiles } from "@/hooks/useProfile";

export function BlockedTaskDialog({
  open,
  taskTitle,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  taskTitle?: string | undefined;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: { blockedBy: string | null; reason: string }) => void;
  submitting?: boolean;
}) {
  const { data: profiles } = useProfiles();
  const [blockedBy, setBlockedBy] = useState<string>("none");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setBlockedBy("none");
      setReason("");
    }
  }, [open]);

  const valid = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apa/Siapa yang menyumbat?</DialogTitle>
          <DialogDescription>
            {taskTitle ? `Task: ${taskTitle}. ` : ""}
            Ceritakan hambatannya supaya ini menjadi permintaan bantuan yang bisa ditindaklanjuti.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Penyumbat (opsional)</Label>
            <Select value={blockedBy} onValueChange={setBlockedBy}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih orang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bukan orang tertentu</SelectItem>
                {(profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="blocked-reason">Alasan hambatan *</Label>
            <Textarea
              id="blocked-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Menunggu data anggaran dari divisi keuangan."
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
                blockedBy: blockedBy === "none" ? null : blockedBy,
                reason: reason.trim(),
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
