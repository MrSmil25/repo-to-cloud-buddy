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
import { Textarea } from "@/components/ui/textarea";

export function CancelRequestDialog({
  open,
  onOpenChange,
  taskTitle,
  direct,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string | undefined;
  /** Kadiv membatalkan langsung, bukan mengajukan. */
  direct?: boolean | undefined;
  submitting?: boolean | undefined;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  const tooShort = reason.trim().length < 15;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{direct ? "Batalkan task" : "Ajukan pembatalan task"}</DialogTitle>
          <DialogDescription>
            {taskTitle ? `Task: ${taskTitle}. ` : ""}
            {direct
              ? "Task akan langsung dibatalkan dan alasanmu dicatat."
              : "Kadiv kamu akan meninjau alasan ini. Kalau tidak diputuskan dalam 3 hari, otomatis disetujui."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Kenapa task ini perlu dibatalkan?"
          />
          <p className="text-xs text-muted-foreground">
            Minimal 15 karakter ({reason.trim().length}/15).
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={tooShort || submitting} onClick={() => onSubmit(reason.trim())}>
            {direct ? "Batalkan task" : "Kirim permintaan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
