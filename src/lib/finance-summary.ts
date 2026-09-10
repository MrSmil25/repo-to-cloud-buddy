import { supabase } from "@/lib/supabase-external";

export type WalletFilter = "all" | "ops" | "kas";
export type PeriodKey = "this-month" | "last-month" | "this-quarter" | "custom";

export type FinancialWallets = {
  ops_masuk_total: number;
  ops_keluar_total: number;
  ops_saldo: number;
  kas_masuk_total: number;
  kas_keluar_total: number;
  kas_saldo: number;
  total_saldo: number;
};

export type PeriodSummary = {
  ops_masuk: number;
  ops_keluar: number;
  ops_net: number;
  kas_masuk: number;
  kas_keluar: number;
  kas_net: number;
  total_masuk: number;
  total_keluar: number;
  total_net: number;
};

export type MonthlyCashflowRow = {
  bulan: string;
  dompet: "Operasional" | "Kas";
  arah: "Income" | "Expense";
  category: string | null;
  total: number;
};

export type CategoryBreakdownRow = {
  dompet: "Operasional" | "Kas";
  category: string | null;
  total: number;
};

export type CashflowProjection = {
  saldo_sekarang: number;
  pemasukan_perkiraan_30h: number;
  pemasukan_perkiraan_60h: number;
  pemasukan_perkiraan_90h: number;
  pengeluaran_rata2_bulanan: number;
  proyeksi_30h: number;
  proyeksi_60h: number;
  proyeksi_90h: number;
};

const EMPTY_SUMMARY: PeriodSummary = {
  ops_masuk: 0,
  ops_keluar: 0,
  ops_net: 0,
  kas_masuk: 0,
  kas_keluar: 0,
  kas_net: 0,
  total_masuk: 0,
  total_keluar: 0,
  total_net: 0,
};

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type DateRange = { from: string; to: string };

export const WALLET_LABEL: Record<WalletFilter, string> = {
  all: "Semua Dompet",
  ops: "Operasional",
  kas: "Kas",
};

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  "this-month": "Bulan Ini",
  "last-month": "Bulan Lalu",
  "this-quarter": "Kuartal Ini",
  custom: "Kustom",
};

/** Rentang tanggal untuk periode terpilih. */
export function periodRange(key: PeriodKey, custom?: DateRange): DateRange {
  const now = new Date();
  if (key === "this-month") {
    return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) };
  }
  if (key === "last-month") {
    return {
      from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (key === "this-quarter") {
    const startMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      from: toISODate(new Date(now.getFullYear(), startMonth, 1)),
      to: toISODate(now),
    };
  }
  return (
    custom ?? {
      from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toISODate(now),
    }
  );
}

/** Periode pembanding: rentang dengan panjang sama, tepat sebelum periode terpilih. */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const lengthMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 86_400_000);
  const prevFrom = new Date(prevTo.getTime() - lengthMs);
  return { from: toISODate(prevFrom), to: toISODate(prevTo) };
}

export function comparisonLabel(key: PeriodKey): string {
  if (key === "this-month") return "Bulan Lalu";
  if (key === "last-month") return "Bulan Sebelumnya";
  if (key === "this-quarter") return "Kuartal Lalu";
  return "Periode Sebelumnya";
}

const num = (value: unknown) => Number(value ?? 0);

export async function fetchWallets(): Promise<FinancialWallets> {
  const { data, error } = await supabase.from("financial_wallets").select("*").maybeSingle();
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ops_masuk_total: num(row["ops_masuk_total"]),
    ops_keluar_total: num(row["ops_keluar_total"]),
    ops_saldo: num(row["ops_saldo"]),
    kas_masuk_total: num(row["kas_masuk_total"]),
    kas_keluar_total: num(row["kas_keluar_total"]),
    kas_saldo: num(row["kas_saldo"]),
    total_saldo: num(row["total_saldo"]),
  };
}

export async function fetchPeriodSummary(range: DateRange): Promise<PeriodSummary> {
  const { data, error } = await supabase.rpc("financial_period_summary", {
    p_start: range.from,
    p_end: range.to,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!row) return EMPTY_SUMMARY;
  return {
    ops_masuk: num(row["ops_masuk"]),
    ops_keluar: num(row["ops_keluar"]),
    ops_net: num(row["ops_net"]),
    kas_masuk: num(row["kas_masuk"]),
    kas_keluar: num(row["kas_keluar"]),
    kas_net: num(row["kas_net"]),
    total_masuk: num(row["total_masuk"]),
    total_keluar: num(row["total_keluar"]),
    total_net: num(row["total_net"]),
  };
}

export async function fetchMonthlyCashflow(): Promise<MonthlyCashflowRow[]> {
  const { data, error } = await supabase
    .from("monthly_cashflow")
    .select("*")
    .order("bulan", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    bulan: String(r["bulan"]),
    dompet: (r["dompet"] as "Operasional" | "Kas") ?? "Operasional",
    arah: (r["arah"] as "Income" | "Expense") ?? "Income",
    category: (r["category"] as string | null) ?? null,
    total: num(r["total"]),
  }));
}

export async function fetchCategoryBreakdown(
  range: DateRange,
  arah: "Income" | "Expense",
): Promise<CategoryBreakdownRow[]> {
  const { data, error } = await supabase.rpc("financial_category_breakdown", {
    p_start: range.from,
    p_end: range.to,
    p_arah: arah,
  });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    dompet: (r["dompet"] as "Operasional" | "Kas") ?? "Operasional",
    category: (r["category"] as string | null) ?? null,
    total: num(r["total"]),
  }));
}

export async function fetchProjection(): Promise<CashflowProjection | null> {
  const { data, error } = await supabase.from("cashflow_projection").select("*").maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    saldo_sekarang: num(row["saldo_sekarang"]),
    pemasukan_perkiraan_30h: num(row["pemasukan_perkiraan_30h"]),
    pemasukan_perkiraan_60h: num(row["pemasukan_perkiraan_60h"]),
    pemasukan_perkiraan_90h: num(row["pemasukan_perkiraan_90h"]),
    pengeluaran_rata2_bulanan: num(row["pengeluaran_rata2_bulanan"]),
    proyeksi_30h: num(row["proyeksi_30h"]),
    proyeksi_60h: num(row["proyeksi_60h"]),
    proyeksi_90h: num(row["proyeksi_90h"]),
  };
}

/** Ambil angka masuk/keluar/net dari ringkasan periode sesuai filter dompet. */
export function walletSlice(summary: PeriodSummary, wallet: WalletFilter) {
  if (wallet === "ops")
    return { masuk: summary.ops_masuk, keluar: summary.ops_keluar, net: summary.ops_net };
  if (wallet === "kas")
    return { masuk: summary.kas_masuk, keluar: summary.kas_keluar, net: summary.kas_net };
  return { masuk: summary.total_masuk, keluar: summary.total_keluar, net: summary.total_net };
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
