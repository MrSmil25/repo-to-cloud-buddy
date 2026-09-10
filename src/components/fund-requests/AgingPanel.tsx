import { Link } from "@tanstack/react-router";
import { AlarmClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, formatDateID } from "@/lib/format";
import { agingClass, type AgingRow } from "@/lib/fund-requests";

type Props = { rows: AgingRow[] | undefined; loading?: boolean };

export function AgingPanel({ rows, loading }: Props) {
  const total = (rows ?? []).reduce((a, r) => a + Number(r.amount_idr ?? 0), 0);

  return (
    <Card className="border-violet-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlarmClock className="size-4 text-violet-600" />
          Reimbursement Belum Diganti
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Uang anggota yang sedang nyangkut:{" "}
          <strong className="text-foreground">{formatRupiah(total)}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (rows ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ✅ Tidak ada reimbursement yang menunggu penggantian.
          </p>
        ) : (
          (rows ?? []).map((r) => (
            <Link
              key={r.id}
              to="/fund-requests/$id"
              params={{ id: r.id }}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {r.requester_name ?? "Anggota"}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · {r.requester_division ?? "-"}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.purpose} · {formatDateID(r.expense_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatRupiah(r.amount_idr)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${agingClass(r.days_outstanding)}`}
                >
                  {Number(r.days_outstanding ?? 0)} hari
                </span>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
