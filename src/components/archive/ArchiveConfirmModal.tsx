import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  ARCHIVE_LABELS,
  archiveRecord,
  restoreRecord,
  type ArchivableTable,
} from "@/lib/archive";

export type ArchiveModalMode = "archive" | "restore";

export function ArchiveConfirmModal({
  open,
  onOpenChange,
  mode,
  table,
  recordId,
  recordName,
  extraWarning,
  invalidateKeys = [],
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: ArchiveModalMode;
  table: ArchivableTable;
  recordId: string;
  recordName: string;
  extraWarning?: string;
  invalidateKeys?: string[];
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () =>
      mode === "archive" ? archiveRecord(table, recordId, reason) : restoreRecord(table, recordId),
    onSuccess: (result) => {
      if (result === "DENIED") {
        toast.error(
          mode === "archive"
            ? "Kamu tidak berwenang mengarsipkan item ini."
            : "Kamu tidak berwenang memulihkan item ini.",
        );
        return;
      }
      toast.success(mode === "archive" ? "Item diarsipkan." : "Item dipulihkan.");
      for (const key of invalidateKeys) queryClient.invalidateQueries({ queryKey: [key] });
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: Error) => toast.error("Gagal: " + e.message),
  });

  const label = ARCHIVE_LABELS[table];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "archive"
              ? `Arsipkan ${label}: ${recordName}?`
              : `Pulihkan ${label}: ${recordName}?`}
          </DialogTitle>
          <DialogDescription>
            {mode === "archive"
              ? "Item yang diarsipkan tidak muncul di daftar utama tapi tetap tersimpan dan bisa dipulihkan."
              : "Item akan kembali muncul di daftar utama."}
          </DialogDescription>
        </DialogHeader>

        {mode === "archive" && (
          <div className="space-y-2">
            <Label htmlFor="archive-reason" className="text-xs">
              Alasan (opsional, disarankan)
            </Label>
            <Textarea
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tulis alasan pengarsipan…"
              rows={3}
            />
            {extraWarning && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {extraWarning}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button
            variant={mode === "archive" ? "secondary" : "default"}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mode === "archive" ? "Arsipkan" : "Pulihkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
