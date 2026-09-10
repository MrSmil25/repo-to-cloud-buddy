import { Link } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import type { StuckMoney as StuckMoneyData } from "@/lib/command-center";

export function StuckMoney({ data }: { data: StuckMoneyData }) {
  const alarming = data.oldestDays > 14;

  return (
    <Card className={alarming ? "border-red-300 bg-red-50/60" : undefined}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${alarming ? "text-red-800" : ""}`}>
          <HandCoins className="size-5" /> Uang Anggota Nyangkut
        </CardTitle>
        <CardDescription>
          Reimbursement yang sudah ditalangi anggota tapi belum diganti organisasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total belum diganti</p>
            <p
              className={`text-xl font-bold tabular-nums ${alarming ? "text-red-700" : ""}`}
            >
              {formatRupiah(data.total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Orang menunggu</p>
            <p className="text-xl font-bold tabular-nums">{data.peopleCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tagihan terlama</p>
            <p className={`text-xl font-bold tabular-nums ${alarming ? "text-red-700" : ""}`}>
              {data.oldestDays} hari
            </p>
          </div>
        </div>

        {data.rows.length > 0 && (
          <ul className="space-y-1 text-sm">
            {data.rows.map((r) => (
              <li key={r.id ?? r.purpose} className="flex justify-between gap-3">
                <span className="truncate">
                  {r.requester_name ?? "Anggota"} · {r.purpose ?? "-"}
                </span>
                <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {formatRupiah(r.amount_idr ?? 0)} · {r.days_outstanding ?? 0} hari
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link to="/fund-approvals" className="inline-block text-sm font-medium underline">
          Buka Persetujuan Dana
        </Link>
      </CardContent>
    </Card>
  );
}
