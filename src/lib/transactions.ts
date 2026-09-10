import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Transaction = Database["public"]["Tables"]["fund_transactions"]["Row"];
export type TransactionCategory = Database["public"]["Tables"]["transaction_categories"]["Row"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type TransactionVisibility = Database["public"]["Enums"]["transaction_visibility"];

export const VISIBILITIES: { value: TransactionVisibility; label: string; hint: string }[] = [
  { value: "Public_Org", label: "Public Org", hint: "Public_Org = semua anggota bisa lihat" },
  { value: "Kadiv_And_Above", label: "Kadiv ke atas", hint: "Hanya Kadiv, BPH, Controller, Supervisor" },
  { value: "Controller_Only", label: "Controller saja", hint: "Hanya Controller, Ketua, Supervisor" },
];

export const CATEGORY_TYPE_META: Record<string, { label: string; className: string }> = {
  Income: { label: "Income", className: "bg-emerald-100 text-emerald-700" },
  Expense: { label: "Expense", className: "bg-red-100 text-red-700" },
  Both: { label: "Both", className: "bg-sky-100 text-sky-700" },
};

export function canManageTransactions(role?: string | null) {
  return role === "Controller" || role === "Ketua" || role === "Supervisor";
}

export function canManageCategories(role?: string | null) {
  return (
    role === "Controller" || role === "Ketua" || role === "Waketu" || role === "Supervisor"
  );
}

export type TransactionWithRelations = Transaction & {
  profiles?: { id: string; full_name: string; division: string | null } | null;
  fund_requests?: {
    id: string;
    request_number: string | null;
    purpose: string;
    requester_division: string | null;
  } | null;
  deals?: { id: string; name: string; owner_division: string | null } | null;
  events?: { id: string; name: string } | null;
};

const SELECT =
  "*, profiles:recorded_by(id,full_name,division), fund_requests:related_fund_request_id(id,request_number,purpose,requester_division), deals:related_deal_id(id,name,owner_division), events:related_event_id(id,name)";

export type TransactionFilters = {
  from: string; // yyyy-mm-dd
  to: string;
};

export async function fetchTransactions(f: TransactionFilters): Promise<TransactionWithRelations[]> {
  let q = supabase.from("fund_transactions").select(SELECT);
  if (f.from) q = q.gte("transaction_date", f.from);
  if (f.to) q = q.lte("transaction_date", f.to);
  const { data, error } = await q
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TransactionWithRelations[];
}

/** Divisi terkait: dari pengajuan dana, lalu deal, lalu divisi pencatat. */
export function transactionDivision(t: TransactionWithRelations): string | null {
  return (
    t.fund_requests?.requester_division ??
    t.deals?.owner_division ??
    t.profiles?.division ??
    null
  );
}

export async function fetchCategories(activeOnly = false): Promise<TransactionCategory[]> {
  let q = supabase.from("transaction_categories").select("*");
  if (activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q.order("sort_order", { ascending: true }).order("name");
  if (error) throw error;
  return data ?? [];
}

export type TransactionInput = {
  transaction_date: string;
  type: TransactionType;
  category: string;
  amount_idr: number;
  description: string;
  related_fund_request_id: string | null;
  related_deal_id: string | null;
  related_event_id: string | null;
  proof_url: string | null;
  visibility: TransactionVisibility;
};

export async function createTransaction(input: TransactionInput) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan masuk kembali.");
  const { error } = await supabase
    .from("fund_transactions")
    .insert({ ...input, recorded_by: userId });
  if (error) throw error;
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const { error } = await supabase.from("fund_transactions").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("fund_transactions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchApprovedFundRequests() {
  const { data, error } = await supabase
    .from("fund_requests")
    .select("id,request_number,purpose,amount_idr")
    .in("status", ["Approved", "Disbursed", "Reported"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDealOptions() {
  const { data, error } = await supabase
    .from("deals")
    .select("id,name")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEventOptions() {
  const { data, error } = await supabase
    .from("events")
    .select("id,name,date_start,date_end")
    .order("date_start", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Ringkasan untuk dashboard: saldo dari transaksi Public_Org & expense bulan ini. */
export async function fetchDashboardFinance() {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("fund_transactions")
    .select("type,amount_idr,transaction_date,visibility")
    .eq("visibility", "Public_Org");
  if (error) throw error;
  let income = 0;
  let expense = 0;
  let monthExpense = 0;
  for (const t of data ?? []) {
    const amt = Number(t.amount_idr ?? 0);
    if (t.type === "Income") income += amt;
    else {
      expense += amt;
      if (t.transaction_date >= monthStart) monthExpense += amt;
    }
  }
  return { balance: income - expense, monthExpense };
}

// ---- Kategori ----
export type CategoryInput = {
  name: string;
  type: string;
  color_hex: string | null;
  is_active: boolean;
  sort_order: number;
};

export async function createCategory(input: CategoryInput) {
  const { error } = await supabase.from("transaction_categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { error } = await supabase.from("transaction_categories").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
  if (error) throw error;
}

export function monthRange(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const last = new Date(y, m + 1, 0).getDate();
  return { from: `${y}-${pad(m + 1)}-01`, to: `${y}-${pad(m + 1)}-${pad(last)}` };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
