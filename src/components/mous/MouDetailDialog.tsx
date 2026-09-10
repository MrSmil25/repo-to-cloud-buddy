import { toast } from "sonner";
import { ExternalLink, Pencil } from "lucide-react";
import { formatDateID } from "@/lib/format";
import { resolveDocUrl } from "@/lib/fund-requests";
import {
  MOU_STATUS_META,
  daysLeft,
  daysLeftClassName,
  daysLeftLabel,
  type MouWithRelations,
} from "@/lib/mous";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? "—"}</p>
    </div>
  );
}

export function MouDetailDialog({
  open,
  onOpenChange,
  mou,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mou: MouWithRelations | null;
  onEdit: () => void;
}) {
  if (!mou) return null;
  const meta = MOU_STATUS_META[mou.status];
  const left = daysLeft(mou.expiry_date);

  async function openDoc() {
    try {
      const url = await resolveDocUrl(mou?.pdf_url);
      if (!url) {
        toast.error("Dokumen tidak tersedia");
        return;
      }
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error("Gagal membuka dokumen: " + (e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mou.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta?.className ?? ""}`}>
            {meta?.label ?? mou.status}
          </span>

          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Perusahaan" value={mou.companies?.name ?? "—"} />
            <Row label="Deal terkait" value={mou.deals?.name ?? "—"} />
            <Row label="Ditandatangani" value={formatDateID(mou.signed_date)} />
            <Row label="Expired" value={formatDateID(mou.expiry_date)} />
            <Row
              label="Sisa hari"
              value={<span className={daysLeftClassName(left)}>{daysLeftLabel(left)}</span>}
            />
            <Row label="Reminder H-" value={mou.renewal_reminder_days ?? "—"} />
            <Row label="Penandatangan kita" value={mou.profiles?.full_name ?? "—"} />
            <Row
              label="Penandatangan mereka"
              value={
                mou.signatory_their_name
                  ? `${mou.signatory_their_name}${mou.signatory_their_title ? ` — ${mou.signatory_their_title}` : ""}`
                  : "—"
              }
            />
          </div>

          {mou.notes && <Row label="Catatan" value={mou.notes} />}
        </div>

        <DialogFooter>
          {mou.pdf_url && (
            <Button variant="outline" onClick={openDoc}>
              <ExternalLink className="size-4" /> Lihat Dokumen
            </Button>
          )}
          <Button onClick={onEdit}>
            <Pencil className="size-4" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
