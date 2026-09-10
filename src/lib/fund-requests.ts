import { supabase } from "@/lib/supabase-external";

/**
 * Tabel fund_requests dan view reimbursement_aging belum tercakup di tipe
 * Supabase hasil generate, jadi akses lewat klien tanpa tipe.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export const FUND_STATUSES = [
  "Draft",
  "Submitted",
  "Under_Review",
  "Approved",
  "Rejected",
  "Disbursed",
  "Reported",
] as const;
export type FundStatus = (typeof FUND_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  Draft: "Draf",
  Submitted: "Diajukan",
  Under_Review: "Sedang Ditinjau",
  Approved: "Disetujui",
  Rejected: "Ditolak",
  Disbursed: "Dana Cair",
  Reported: "LPJ Masuk",
};

export const STATUS_CLASS: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Submitted: "bg-sky-100 text-sky-700",
  Under_Review: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Disbursed: "bg-violet-100 text-violet-700",
  Reported: "bg-slate-200 text-slate-700",
};

export const URGENCIES = ["Normal", "Urgent", "Emergency"] as const;
export const URGENCY_LABEL: Record<string, string> = {
  Normal: "Normal",
  Urgent: "Mendesak",
  Emergency: "Darurat",
};

export const REQUEST_KINDS = ["Pengajuan", "Reimbursement"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

const KIND_META_MAP: Record<string, { label: string; badge: string }> = {
  Pengajuan: { label: "Pengajuan", badge: "bg-sky-100 text-sky-700" },
  Reimbursement: { label: "Reimbursement", badge: "bg-violet-100 text-violet-700" },
};

export function kindMeta(kind?: string | null): { label: string; badge: string } {
  return (
    KIND_META_MAP[kind ?? "Pengajuan"] ?? {
      label: "Pengajuan",
      badge: "bg-sky-100 text-sky-700",
    }
  );
}

export type BreakdownItem = { item: string; qty: number; unit_price: number };

export type FundRequest = {
  id: string;
  request_number: string | null;
  request_kind: string | null;
  requester_id: string;
  requester_division: string | null;
  purpose: string;
  amount_idr: number;
  breakdown: BreakdownItem[] | null;
  urgency: string;
  status: string;
  approver_id: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  disbursed_at: string | null;
  disbursement_proof_url: string | null;
  report_submitted_at: string | null;
  report_url: string | null;
  receipt_url: string | null;
  expense_date: string | null;
  event_id: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AgingRow = {
  id: string;
  request_number: string | null;
  requester_id: string | null;
  requester_name: string | null;
  requester_division: string | null;
  purpose: string | null;
  amount_idr: number | null;
  expense_date: string | null;
  status: string | null;
  days_outstanding: number | null;
};

const FIELDS =
  "id,request_number,request_kind,requester_id,requester_division,purpose,amount_idr,breakdown,urgency,status,approver_id,approved_at,approval_notes,disbursed_at,disbursement_proof_url,report_submitted_at,report_url,receipt_url,expense_date,event_id,notes,created_at,updated_at";

export async function fetchFundRequests(): Promise<FundRequest[]> {
  const { data, error } = await db
    .from("fund_requests")
    .select(FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FundRequest[];
}

export async function fetchFundRequest(id: string): Promise<FundRequest | null> {
  const { data, error } = await db.from("fund_requests").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as FundRequest | null;
}

export async function fetchReimbursementAging(): Promise<AgingRow[]> {
  const { data, error } = await db
    .from("reimbursement_aging")
    .select("*")
    .order("days_outstanding", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AgingRow[];
}

export async function fetchMyPendingReimbursements(userId: string): Promise<AgingRow[]> {
  const { data, error } = await db
    .from("reimbursement_aging")
    .select("*")
    .eq("requester_id", userId)
    .order("days_outstanding", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AgingRow[];
}

export async function fetchEventOptions(): Promise<{ id: string; name: string; date_start?: string | null; date_end?: string | null }[]> {
  const { data } = await db
    .from("events")
    .select("id,name,date_start,date_end")
    .order("date_start", { ascending: false });
  return (data ?? []) as { id: string; name: string; date_start?: string | null; date_end?: string | null }[];
}

/** Unggah bukti ke bucket documents, kembalikan path-nya. */
export async function uploadDocument(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function resolveDocUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function isPdfPath(path?: string | null) {
  return !!path && (path.toLowerCase().split("?")[0] ?? "").endsWith(".pdf");
}

async function nextRequestNumber(): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("generate_fund_request_number");
  if (error) return null;
  return (data as string) ?? null;
}

export type NewFundRequest = {
  purpose: string;
  amount_idr: number;
  urgency: string;
  breakdown: BreakdownItem[] | null;
  event_id: string | null;
  notes: string | null;
};

export type NewReimbursement = NewFundRequest & {
  expense_date: string;
  receipt_url: string;
};

async function insertRequest(payload: Record<string, unknown>) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan masuk kembali.");
  const { data: profile } = await db
    .from("profiles")
    .select("division")
    .eq("id", userId)
    .maybeSingle();
  const request_number = await nextRequestNumber();
  const { data, error } = await db
    .from("fund_requests")
    .insert({
      ...payload,
      requester_id: userId,
      requester_division: (profile as { division?: string | null } | null)?.division ?? null,
      ...(request_number ? { request_number } : {}),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export function createFundRequest(input: NewFundRequest) {
  return insertRequest({
    request_kind: "Pengajuan",
    status: "Submitted",
    purpose: input.purpose,
    amount_idr: input.amount_idr,
    urgency: input.urgency,
    breakdown: input.breakdown,
    event_id: input.event_id,
    notes: input.notes,
  });
}

export function createReimbursement(input: NewReimbursement) {
  return insertRequest({
    request_kind: "Reimbursement",
    status: "Submitted",
    purpose: input.purpose,
    amount_idr: input.amount_idr,
    urgency: input.urgency,
    breakdown: input.breakdown,
    event_id: input.event_id,
    notes: input.notes,
    expense_date: input.expense_date,
    receipt_url: input.receipt_url,
  });
}

async function patchRequest(id: string, patch: Record<string, unknown>) {
  const { error } = await db.from("fund_requests").update(patch).eq("id", id);
  if (error) throw error;
}

export async function approveRequest(id: string, notes?: string | null) {
  const { data: userData } = await supabase.auth.getUser();
  await patchRequest(id, {
    status: "Approved",
    approver_id: userData.user?.id ?? null,
    approved_at: new Date().toISOString(),
    approval_notes: notes ?? null,
  });
}

export async function rejectRequest(id: string, reason: string) {
  const { data: userData } = await supabase.auth.getUser();
  await patchRequest(id, {
    status: "Rejected",
    approver_id: userData.user?.id ?? null,
    approved_at: new Date().toISOString(),
    approval_notes: reason,
  });
}

export async function markDisbursed(id: string, proofPath?: string | null) {
  await patchRequest(id, {
    status: "Disbursed",
    disbursed_at: new Date().toISOString(),
    ...(proofPath ? { disbursement_proof_url: proofPath } : {}),
  });
}

export function agingClass(days: number | null | undefined) {
  const d = Number(days ?? 0);
  if (d > 30) return "bg-red-700 text-white font-bold";
  if (d > 14) return "bg-red-100 text-red-700 font-semibold";
  if (d > 7) return "bg-amber-100 text-amber-700";
  return "bg-muted text-muted-foreground";
}

export function canApproveFunds(role?: string | null) {
  return (
    role === "Controller" || role === "Ketua" || role === "Waketu" || role === "Supervisor"
  );
}

export const REIMBURSEMENT_STEPS = ["Submitted", "Approved", "Disbursed"] as const;
export const PENGAJUAN_STEPS = [
  "Submitted",
  "Under_Review",
  "Approved",
  "Disbursed",
  "Reported",
] as const;

export function sumBreakdown(items: BreakdownItem[] | null | undefined) {
  return (items ?? []).reduce(
    (acc, it) => acc + Number(it.qty ?? 0) * Number(it.unit_price ?? 0),
    0,
  );
}
