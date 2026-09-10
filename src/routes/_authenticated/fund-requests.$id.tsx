import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceiptPreview } from "@/components/fund-requests/ReceiptPreview";
import { formatRupiah, formatDateID, relativeTime, daysBetween } from "@/lib/format";
import { useProfiles } from "@/hooks/useProfile";
import { fetchEventOptions } from "@/lib/deals";
import {
  fetchFundRequest,
  kindMeta,
  STATUS_CLASS,
  STATUS_LABEL,
  PENGAJUAN_STEPS,
  REIMBURSEMENT_STEPS,
  agingClass,
  sumBreakdown,
  URGENCY_LABEL,
} from "@/lib/fund-requests";

export const Route = createFileRoute("/_authenticated/fund-requests/$id")({
  head: () => ({
    meta: [
      { title: "Detail Pengajuan Dana | OrgTool" },
      {
        name: "description",
        content:
          "Rincian pengajuan dana atau reimbursement: status persetujuan, bukti struk, dan riwayat pencairan.",
      },
      { property: "og:title", content: "Detail Pengajuan Dana" },
      {
        property: "og:description",
        content: "Status persetujuan, bukti struk, dan riwayat pencairan pengajuan dana.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FundRequestDetail,
});

const STEP_ORDER: Record<string, number> = {
  Draft: 0,
  Submitted: 1,
  Under_Review: 2,
  Approved: 3,
  Disbursed: 4,
  Reported: 5,
  Rejected: 99,
};

function FundRequestDetail() {
  const { id } = Route.useParams();
  const { data: req, isLoading } = useQuery({
    queryKey: ["fund-request", id],
    queryFn: () => fetchFundRequest(id),
  });
  const { data: profiles } = useProfiles();
  const { data: eventOptions } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });
  const nameOf = (pid?: string | null) =>
    (profiles ?? []).find((p) => p.id === pid)?.full_name ?? "-";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!req) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Pengajuan tidak ditemukan atau kamu tidak punya akses.
        </CardContent>
      </Card>
    );
  }

  const kind = req.request_kind ?? "Pengajuan";
  const isReimbursement = kind === "Reimbursement";
  const meta = kindMeta(req.request_kind);
  const steps = isReimbursement ? REIMBURSEMENT_STEPS : PENGAJUAN_STEPS;
  const currentOrder = STEP_ORDER[req.status] ?? 0;
  const outstandingDays =
    isReimbursement && req.expense_date && !["Disbursed", "Reported", "Rejected"].includes(req.status)
      ? Math.max(0, daysBetween(new Date(req.expense_date), new Date()))
      : null;

  return (
    <div className="space-y-6">
      <Link
        to="/fund-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Kembali ke daftar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.badge}`}>{meta.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[req.status] ?? "bg-muted"}`}
            >
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
            {outstandingDays !== null && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${agingClass(outstandingDays)}`}>
                Menunggu ganti: {outstandingDays} hari
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {req.request_number ?? "Tanpa nomor"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {nameOf(req.requester_id)} · {req.requester_division ?? "-"} ·{" "}
            {relativeTime(req.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {isReimbursement ? "Jumlah ditalangi" : "Jumlah diminta"}
          </p>
          <p className="text-2xl font-bold">{formatRupiah(req.amount_idr)}</p>
        </div>
      </div>

      {isReimbursement && (
        <Card className="border-violet-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-violet-600" />
              Ditalangi pada {formatDateID(req.expense_date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptPreview path={req.receipt_url} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alur Status</CardTitle>
        </CardHeader>
        <CardContent>
          {req.status === "Rejected" ? (
            <p className="text-sm font-medium text-destructive">
              Ditolak{req.approval_notes ? `: ${req.approval_notes}` : "."}
            </p>
          ) : (
            <ol className="flex flex-wrap items-center gap-2">
              {steps.map((s, i) => {
                const done = currentOrder >= (STEP_ORDER[s] ?? 0);
                return (
                  <li key={s} className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                        done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done && <Check className="size-3.5" />}
                      {STATUS_LABEL[s] ?? s}
                    </span>
                    {i < steps.length - 1 && <span className="text-muted-foreground">→</span>}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perihal & Rincian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap">{req.purpose}</p>
            {req.event_id && (
              <Link
                to="/events/$id"
                params={{ id: req.event_id }}
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs text-primary hover:underline"
              >
                🎯 {(eventOptions ?? []).find((e) => e.id === req.event_id)?.name ?? "Event terkait"}
              </Link>
            )}
            <p className="text-muted-foreground">
              Urgensi: {URGENCY_LABEL[req.urgency] ?? req.urgency}
            </p>
            {req.breakdown && req.breakdown.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Harga</th>
                      <th className="p-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {req.breakdown.map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{it.item}</td>
                        <td className="p-2">{it.qty}</td>
                        <td className="p-2">{formatRupiah(it.unit_price)}</td>
                        <td className="p-2">
                          {formatRupiah(Number(it.qty) * Number(it.unit_price))}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/40 font-medium">
                      <td className="p-2" colSpan={3}>
                        Total rincian
                      </td>
                      <td className="p-2">{formatRupiah(sumBreakdown(req.breakdown))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada rincian.</p>
            )}
            {req.notes && <p className="text-muted-foreground">Catatan: {req.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Persetujuan & Pencairan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Penyetuju: <strong>{req.approver_id ? nameOf(req.approver_id) : "-"}</strong>
              {req.approved_at && (
                <span className="text-muted-foreground"> · {formatDateID(req.approved_at)}</span>
              )}
            </p>
            {req.approval_notes && (
              <p className="text-muted-foreground">Catatan penyetuju: {req.approval_notes}</p>
            )}
            <p>
              {isReimbursement ? "Diganti pada" : "Dana cair pada"}:{" "}
              <strong>{req.disbursed_at ? formatDateID(req.disbursed_at) : "belum"}</strong>
            </p>
            {req.disbursement_proof_url && (
              <div className="pt-2">
                <p className="mb-1 text-xs text-muted-foreground">Bukti transfer</p>
                <ReceiptPreview path={req.disbursement_proof_url} label="Bukti transfer" />
              </div>
            )}
            {!isReimbursement && (
              <p>
                LPJ:{" "}
                <strong>
                  {req.report_submitted_at ? formatDateID(req.report_submitted_at) : "belum masuk"}
                </strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
