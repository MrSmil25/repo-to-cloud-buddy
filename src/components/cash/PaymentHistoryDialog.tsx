import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/fund-requests/ReceiptPreview";
import { formatRupiah } from "@/lib/format";
import { PAYMENT_STATUS_META, type CollectionPayment } from "@/lib/cash";

/** "12 Sep 2026, 14:32" */
export function formatDateTimeIndo(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "d MMM yyyy, HH:mm", { locale: idLocale });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function PaymentHistoryDialog({
  payment,
  onClose,
  memberName,
}: {
  payment: CollectionPayment | null;
  onClose: () => void;
  memberName?: string | null;
}) {
  const st = payment
    ? (PAYMENT_STATUS_META[payment.status] ?? PAYMENT_STATUS_META['Belum_Bayar']!)
    : null;
  const name = memberName ?? payment?.profiles?.full_name ?? null;

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Pembayaran</DialogTitle>
          <DialogDescription>
            {payment?.collections?.title ?? "Program kas"}
            {name ? ` · ${name}` : ""}
          </DialogDescription>
        </DialogHeader>

        {payment && st && (
          <div className="space-y-4">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}
            >
              {st.label}
            </span>

            <div className="rounded-xl border px-4">
              <Row label="Jumlah dibayar" value={formatRupiah(payment.amount_paid ?? 0)} />
              <Row label="Diklaim pada" value={formatDateTimeIndo(payment.claimed_at)} />
              <Row
                label="Diverifikasi oleh"
                value={
                  payment.verified_at
                    ? `${payment.verifier?.full_name ?? "—"} · ${formatDateTimeIndo(payment.verified_at)}`
                    : "Belum diverifikasi"
                }
              />
            </div>

            {payment.reject_reason && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Klaim sebelumnya sempat ditolak: {payment.reject_reason}
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold">Bukti pembayaran</p>
              <ReceiptPreview path={payment.proof_url} label="Bukti bayar" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
