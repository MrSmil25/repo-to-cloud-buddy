import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import {
  comparisonLabel,
  fetchCategoryBreakdown,
  fetchMonthlyCashflow,
  fetchPeriodSummary,
  fetchProjection,
  fetchWallets,
  percentChange,
  periodRange,
  previousRange,
  walletSlice,
  PERIOD_LABEL,
  WALLET_LABEL,
  type CategoryBreakdownRow,
  type PeriodKey,
  type WalletFilter,
} from "@/lib/finance-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/finance-summary")({
  head: () => ({
    meta: [
      { title: "Ringkasan Keuangan — OrgTool" },
      {
        name: "description",
        content: "Ringkasan saldo, tren, rincian kategori, dan proyeksi arus kas organisasi.",
      },
      { property: "og:title", content: "Ringkasan Keuangan — OrgTool" },
      {
        property: "og:description",
        content: "Ringkasan saldo, tren, rincian kategori, dan proyeksi arus kas organisasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceSummaryPage,
});

const WALLET_OPTIONS: WalletFilter[] = ["all", "ops", "kas"];
const PERIOD_OPTIONS: PeriodKey[] = ["this-month", "last-month", "this-quarter", "custom"];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
          : "rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40"
      }
    >
      {children}
    </button>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

function walletBadgeClass(dompet: string) {
  return dompet === "Kas"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700";
}

function BreakdownPanel({
  title,
  rows,
  isLoading,
  tone,
}: {
  title: string;
  rows: CategoryBreakdownRow[];
  isLoading: boolean;
  tone: "income" | "expense";
}) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada data pada periode ini.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sorted.map((row, i) => {
            const pct = total > 0 ? (row.total / total) * 100 : 0;
            return (
              <li key={`${row.dompet}-${row.category}-${i}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${walletBadgeClass(row.dompet)}`}
                    >
                      {row.dompet}
                    </span>
                    <span className="font-medium">{row.category ?? "Lainnya"}</span>
                  </span>
                  <span className="text-sm font-semibold">{formatRupiah(row.total)}</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      tone === "income" ? "h-full bg-emerald-500" : "h-full bg-red-500"
                    }
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ComparisonCard({
  title,
  value,
  previous,
  higherIsBetter,
  compareLabel,
  isLoading,
}: {
  title: string;
  value: number;
  previous: number;
  higherIsBetter: boolean;
  compareLabel: string;
  isLoading: boolean;
}) {
  const change = percentChange(value, previous);
  const diff = value - previous;
  const up = diff >= 0;
  const good = higherIsBetter ? up : !up;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-40" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight break-words">{formatRupiah(value)}</p>
      )}
      {!isLoading &&
        (change === null ? (
          <p className="mt-2 text-xs text-muted-foreground">Data pembanding belum ada</p>
        ) : (
          <p
            className={`mt-2 flex items-center gap-1 text-xs font-medium ${good ? "text-emerald-600" : "text-red-600"}`}
          >
            {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {`${up ? "+" : ""}${change.toFixed(0)}% dari ${compareLabel} (${formatRupiah(Math.abs(diff))})`}
          </p>
        ))}
    </div>
  );
}

function FinanceSummaryPage() {
  const [wallet, setWallet] = useState<WalletFilter>("all");
  const [period, setPeriod] = useState<PeriodKey>("this-month");
  const initial = periodRange("this-month");
  const [customFrom, setCustomFrom] = useState(initial.from);
  const [customTo, setCustomTo] = useState(initial.to);

  const range = useMemo(
    () => periodRange(period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo],
  );
  const prev = useMemo(() => previousRange(range), [range]);

  const walletsQuery = useQuery({ queryKey: ["fin-wallets"], queryFn: fetchWallets });
  const summaryQuery = useQuery({
    queryKey: ["fin-summary", range.from, range.to],
    queryFn: () => fetchPeriodSummary(range),
  });
  const prevSummaryQuery = useQuery({
    queryKey: ["fin-summary", prev.from, prev.to],
    queryFn: () => fetchPeriodSummary(prev),
  });
  const monthlyQuery = useQuery({ queryKey: ["fin-monthly"], queryFn: fetchMonthlyCashflow });
  const incomeQuery = useQuery({
    queryKey: ["fin-breakdown", "Income", range.from, range.to],
    queryFn: () => fetchCategoryBreakdown(range, "Income"),
  });
  const expenseQuery = useQuery({
    queryKey: ["fin-breakdown", "Expense", range.from, range.to],
    queryFn: () => fetchCategoryBreakdown(range, "Expense"),
  });
  const projectionQuery = useQuery({
    queryKey: ["fin-projection"],
    queryFn: fetchProjection,
    enabled: wallet === "all",
  });

  const wallets = walletsQuery.data;
  const current = summaryQuery.data;
  const previousSummary = prevSummaryQuery.data;
  const curSlice = current ? walletSlice(current, wallet) : { masuk: 0, keluar: 0, net: 0 };
  const prevSlice = previousSummary
    ? walletSlice(previousSummary, wallet)
    : { masuk: 0, keluar: 0, net: 0 };

  const chartData = useMemo(() => {
    const rows = (monthlyQuery.data ?? []).filter((r) =>
      wallet === "all"
        ? true
        : wallet === "ops"
          ? r.dompet === "Operasional"
          : r.dompet === "Kas",
    );
    const map = new Map<string, { bulan: string; Pemasukan: number; Pengeluaran: number }>();
    for (const r of rows) {
      const key = r.bulan;
      const entry = map.get(key) ?? {
        bulan: format(parseISO(r.bulan), "MMM yy", { locale: idLocale }),
        Pemasukan: 0,
        Pengeluaran: 0,
      };
      if (r.arah === "Income") entry.Pemasukan += r.total;
      else entry.Pengeluaran += r.total;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [monthlyQuery.data, wallet]);

  const filteredIncome = (incomeQuery.data ?? []).filter((r) =>
    wallet === "all" ? true : wallet === "ops" ? r.dompet === "Operasional" : r.dompet === "Kas",
  );
  const filteredExpense = (expenseQuery.data ?? []).filter((r) =>
    wallet === "all" ? true : wallet === "ops" ? r.dompet === "Operasional" : r.dompet === "Kas",
  );

  const projection = projectionQuery.data;
  const projectionTone = (value: number) =>
    value < 0 ? "text-red-600" : value < 1_000_000 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <h1 className="text-xl font-bold tracking-tight">Ringkasan Keuangan</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {WALLET_OPTIONS.map((w) => (
            <Pill key={w} active={wallet === w} onClick={() => setWallet(w)}>
              {WALLET_LABEL[w]}
            </Pill>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((p) => (
            <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
              {PERIOD_LABEL[p]}
            </Pill>
          ))}
        </div>
        {period === "custom" && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="fin-from" className="text-xs">
                Dari
              </Label>
              <Input
                id="fin-from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 h-9 w-40"
              />
            </div>
            <div>
              <Label htmlFor="fin-to" className="text-xs">
                Sampai
              </Label>
              <Input
                id="fin-to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 h-9 w-40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bagian 1: Saldo */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            {wallet === "all"
              ? "Total Kekayaan Organisasi"
              : wallet === "ops"
                ? "Saldo Dompet Operasional"
                : "Saldo Dompet Kas"}
          </p>
          {walletsQuery.isLoading || !wallets ? (
            <Skeleton className="mt-4 h-12 w-56" />
          ) : (
            <p
              className={`mt-3 text-4xl font-bold tracking-tight break-words ${
                (wallet === "all"
                  ? wallets.total_saldo
                  : wallet === "ops"
                    ? wallets.ops_saldo
                    : wallets.kas_saldo) >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {formatRupiah(
                wallet === "all"
                  ? wallets.total_saldo
                  : wallet === "ops"
                    ? wallets.ops_saldo
                    : wallets.kas_saldo,
              )}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {wallet === "all" ? "Gabungan semua dompet" : "Saldo dompet terpilih"}
          </p>
        </div>

        {wallet === "all" ? (
          <>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Dompet Operasional</p>
              <p className="mt-2 text-2xl font-bold break-words">
                {wallets ? formatRupiah(wallets.ops_saldo) : "…"}
              </p>
              <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                Dari sponsor/donasi/dll
              </span>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Dompet Kas</p>
              <p className="mt-2 text-2xl font-bold break-words">
                {wallets ? formatRupiah(wallets.kas_saldo) : "…"}
              </p>
              <span className="mt-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                Dari iuran anggota
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Masuk Total</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600 break-words">
                {wallets
                  ? formatRupiah(
                      wallet === "ops" ? wallets.ops_masuk_total : wallets.kas_masuk_total,
                    )
                  : "…"}
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Keluar Total</p>
              <p className="mt-2 text-2xl font-bold text-red-600 break-words">
                {wallets
                  ? formatRupiah(
                      wallet === "ops" ? wallets.ops_keluar_total : wallets.kas_keluar_total,
                    )
                  : "…"}
              </p>
            </div>
          </>
        )}
      </section>

      {/* Bagian 2: Perbandingan Periode */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Perbandingan Periode</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ComparisonCard
            title="Pemasukan"
            value={curSlice.masuk}
            previous={prevSlice.masuk}
            higherIsBetter
            compareLabel={comparisonLabel(period)}
            isLoading={summaryQuery.isLoading || prevSummaryQuery.isLoading}
          />
          <ComparisonCard
            title="Pengeluaran"
            value={curSlice.keluar}
            previous={prevSlice.keluar}
            higherIsBetter={false}
            compareLabel={comparisonLabel(period)}
            isLoading={summaryQuery.isLoading || prevSummaryQuery.isLoading}
          />
          <ComparisonCard
            title="Net"
            value={curSlice.net}
            previous={prevSlice.net}
            higherIsBetter
            compareLabel={comparisonLabel(period)}
            isLoading={summaryQuery.isLoading || prevSummaryQuery.isLoading}
          />
        </div>
      </section>

      {/* Bagian 3: Tren 12 bulan */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Tren 12 Bulan</h2>
        {monthlyQuery.isLoading ? (
          <Skeleton className="mt-4 h-72" />
        ) : chartData.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada data arus kas bulanan.</p>
        ) : (
          <>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v: number) => formatRupiahShort(v)} width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                  <Legend />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {chartData.length < 12 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Data akan makin lengkap seiring waktu.
              </p>
            )}
          </>
        )}
      </section>

      {/* Bagian 4: Rincian kategori */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownPanel
          title="Uang Masuk Periode Ini"
          rows={filteredIncome}
          isLoading={incomeQuery.isLoading}
          tone="income"
        />
        <BreakdownPanel
          title="Uang Keluar Periode Ini"
          rows={filteredExpense}
          isLoading={expenseQuery.isLoading}
          tone="expense"
        />
      </section>

      {/* Bagian 5: Proyeksi */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Proyeksi Arus Kas</h2>
        {wallet !== "all" ? (
          <div className="rounded-2xl border bg-card p-5 text-sm shadow-sm">
            <p className="text-muted-foreground">
              Proyeksi tersedia untuk tampilan Semua Dompet.
            </p>
            <button
              type="button"
              onClick={() => setWallet("all")}
              className="mt-3 rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-accent/40"
            >
              Lihat Semua Dompet
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Proyeksi ini indikator kasar, bukan ramalan pasti. Pemasukan dihitung dari tagihan
                yang sudah terjadwal (kas yang belum lunas). Pengeluaran diperkirakan dari rata-rata
                3 bulan terakhir. Untuk keputusan besar, tinjau ulang detailnya di halaman Feed
                Keuangan dan Kas.
              </p>
            </div>
            {projectionQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : !projection ? (
              <p className="text-sm text-muted-foreground">Data proyeksi belum tersedia.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(
                  [
                    ["Proyeksi 30 hari", projection.proyeksi_30h],
                    ["Proyeksi 60 hari", projection.proyeksi_60h],
                    ["Proyeksi 90 hari", projection.proyeksi_90h],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border bg-card p-5 shadow-sm">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`mt-2 text-2xl font-bold break-words ${projectionTone(value)}`}>
                      {formatRupiah(value)}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Saldo sekarang + pemasukan diharapkan - rata-rata pengeluaran bulanan
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
