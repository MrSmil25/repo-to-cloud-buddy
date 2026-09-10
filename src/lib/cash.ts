import { supabase } from "@/lib/supabase-external";

/* Tabel kas belum tercakup di tipe hasil generate, jadi akses tanpa tipe. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export const COLLECTION_KINDS = ["Kas_Rutin", "Pengumpulan"] as const;
export type CollectionKind = (typeof COLLECTION_KINDS)[number];

export const KIND_META: Record<string, { label: string; className: string }> = {
  Kas_Rutin: { label: "Kas Rutin", className: "bg-sky-100 text-sky-700" },
  Pengumpulan: { label: "Pengumpulan", className: "bg-violet-100 text-violet-700" },
};

export const COLLECTION_STATUSES = ["Aktif", "Selesai", "Dibatalkan"] as const;
export const COLLECTION_STATUS_CLASS: Record<string, string> = {
  Aktif: "bg-emerald-100 text-emerald-700",
  Selesai: "bg-slate-200 text-slate-700",
  Dibatalkan: "bg-red-100 text-red-700",
};

export const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  Belum_Bayar: { label: "Belum Bayar", className: "bg-muted text-muted-foreground" },
  Menunggu_Verifikasi: { label: "Menunggu Verifikasi", className: "bg-amber-100 text-amber-700" },
  Lunas: { label: "Lunas", className: "bg-emerald-100 text-emerald-700" },
  Ditolak: { label: "Ditolak", className: "bg-red-100 text-red-700" },
};

export function canManageCash(role?: string | null) {
  return (
    role === "Controller" || role === "Ketua" || role === "Waketu" || role === "Supervisor"
  );
}

export type Collection = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  amount_per_person: number;
  due_date: string | null;
  target_division: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
};

export type CollectionProgress = {
  collection_id: string;
  title: string;
  kind: string;
  amount_per_person: number;
  due_date: string | null;
  status: string;
  target_division: string | null;
  total_tagihan: number;
  total_lunas: number;
  total_nunggu: number;
  total_terkumpul: number;
};

export type CollectionPayment = {
  id: string;
  collection_id: string;
  member_id: string;
  status: string;
  amount_paid: number | null;
  proof_url: string | null;
  claimed_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  reject_reason: string | null;
  created_at?: string | null;
  collections?: Collection | null;
  profiles?: { id: string; full_name: string | null; division: string | null; photo_url: string | null } | null;
  verifier?: { id: string; full_name: string | null } | null;
};

export type CashExpense = {
  id: string;
  expense_date: string;
  description: string;
  amount_idr: number;
  proof_url: string | null;
  recorded_by: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

export type CashBalance = {
  total_masuk: number;
  total_keluar: number;
  saldo_kas: number;
};

export async function fetchCashBalance(): Promise<CashBalance> {
  const { data, error } = await db.from("cash_balance").select("*").maybeSingle();
  if (error) throw error;
  return {
    total_masuk: Number(data?.total_masuk ?? 0),
    total_keluar: Number(data?.total_keluar ?? 0),
    saldo_kas: Number(data?.saldo_kas ?? 0),
  };
}

export async function fetchMyBills(): Promise<CollectionPayment[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await db
    .from("collection_payments")
    .select("*, collections(*), verifier:verified_by(id,full_name)")
    .eq("member_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CollectionPayment[];
}

export async function fetchCollectionProgress(): Promise<CollectionProgress[]> {
  const { data, error } = await db.from("collection_progress").select("*");
  if (error) throw error;
  return (data ?? []) as CollectionProgress[];
}

export async function fetchCollectionPayments(collectionId: string): Promise<CollectionPayment[]> {
  const { data, error } = await db
    .from("collection_payments")
    .select(
      "*, collections(*), profiles:member_id(id,full_name,division,photo_url), verifier:verified_by(id,full_name)",
    )
    .eq("collection_id", collectionId);
  if (error) throw error;
  return (data ?? []) as CollectionPayment[];
}

/** Tagihan yang diverifikasi oleh pengguna saat ini (log kerja bendahara). */
export async function fetchMyVerifications(): Promise<CollectionPayment[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await db
    .from("collection_payments")
    .select(
      "*, collections(*), profiles:member_id(id,full_name,division,photo_url), verifier:verified_by(id,full_name)",
    )
    .eq("verified_by", uid)
    .eq("status", "Lunas")
    .order("verified_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CollectionPayment[];
}

/** Semua tagihan kas milik satu anggota (untuk rapor anggota). */
export async function fetchMemberBills(memberId: string): Promise<CollectionPayment[]> {
  const { data, error } = await db
    .from("collection_payments")
    .select("*, collections(*), verifier:verified_by(id,full_name)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CollectionPayment[];
}


export async function fetchPendingClaims(): Promise<CollectionPayment[]> {
  const { data, error } = await db
    .from("collection_payments")
    .select("*, collections(*), profiles:member_id(id,full_name,division,photo_url)")
    .eq("status", "Menunggu_Verifikasi")
    .order("claimed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CollectionPayment[];
}

export async function fetchCashExpenses(): Promise<CashExpense[]> {
  const { data, error } = await db
    .from("cash_expenses")
    .select("*, profiles:recorded_by(full_name)")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CashExpense[];
}

export async function createCollection(input: {
  kind: string;
  title: string;
  description?: string | null;
  amount_per_person: number;
  due_date?: string | null;
  target_division?: string | null;
}): Promise<{ collection: Collection; generated: number }> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("collections")
    .insert({
      kind: input.kind,
      title: input.title,
      description: input.description || null,
      amount_per_person: input.amount_per_person,
      due_date: input.due_date || null,
      target_division: input.target_division || null,
      status: "Aktif",
      created_by: userData.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const generated = await generateBills(data.id);
  return { collection: data as Collection, generated };
}

export async function generateBills(collectionId: string): Promise<number> {
  const { data, error } = await db.rpc("generate_collection_bills", {
    p_collection: collectionId,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function updateCollectionStatus(id: string, status: string) {
  const { error } = await db.from("collections").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function claimPayment(input: {
  id: string;
  amount_paid: number;
  proof_url: string;
}) {
  const { error } = await db
    .from("collection_payments")
    .update({
      status: "Menunggu_Verifikasi",
      amount_paid: input.amount_paid,
      proof_url: input.proof_url,
      claimed_at: new Date().toISOString(),
      reject_reason: null,
    })
    .eq("id", input.id);
  if (error) throw error;
}

export async function verifyPayment(id: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await db
    .from("collection_payments")
    .update({
      status: "Lunas",
      verified_by: userData.user?.id ?? null,
      verified_at: new Date().toISOString(),
      reject_reason: null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectPayment(id: string, reason: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await db
    .from("collection_payments")
    .update({
      status: "Ditolak",
      reject_reason: reason,
      verified_by: userData.user?.id ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function createCashExpense(input: {
  expense_date: string;
  description: string;
  amount_idr: number;
  proof_url?: string | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await db.from("cash_expenses").insert({
    expense_date: input.expense_date,
    description: input.description,
    amount_idr: input.amount_idr,
    proof_url: input.proof_url || null,
    recorded_by: userData.user?.id ?? null,
  });
  if (error) throw error;
}
