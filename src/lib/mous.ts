import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Mou = Database["public"]["Tables"]["mous"]["Row"];
export type MouStatus = Database["public"]["Enums"]["mou_status"];

export const MOU_STATUSES: MouStatus[] = [
  "Draft",
  "Under_Review",
  "Signed",
  "Expired",
  "Terminated",
];

export const MOU_STATUS_META: Record<string, { label: string; className: string }> = {
  Draft: { label: "Draft", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
  Under_Review: {
    label: "Sedang Ditinjau",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  Signed: {
    label: "Ditandatangani",
    className: "bg-green-600/10 text-green-700 border-green-600/30",
  },
  Expired: {
    label: "Kedaluwarsa",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  Terminated: {
    label: "Dihentikan",
    className: "bg-neutral-900/10 text-neutral-900 border-neutral-900/40",
  },
};

export type MouWithRelations = Mou & {
  companies?: { id: string; name: string } | null;
  deals?: { id: string; name: string } | null;
  profiles?: { id: string; full_name: string } | null;
};

const SELECT =
  "*, companies:company_id(id,name), deals:deal_id(id,name), profiles:signatory_our_side_id(id,full_name)";

export async function fetchMous(): Promise<MouWithRelations[]> {
  const { data, error } = await supabase
    .from("mous")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MouWithRelations[];
}

export async function fetchMousByCompany(companyId: string): Promise<MouWithRelations[]> {
  const { data, error } = await supabase
    .from("mous")
    .select(SELECT)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MouWithRelations[];
}

export async function fetchDealOptionsByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("deals")
    .select("id,name")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type MouInput = {
  title: string;
  company_id: string | null;
  deal_id: string | null;
  signed_date: string | null;
  expiry_date: string | null;
  pdf_url: string | null;
  signatory_our_side_id: string | null;
  signatory_their_name: string | null;
  signatory_their_title: string | null;
  status: MouStatus;
  renewal_reminder_days: number | null;
  notes: string | null;
};

export async function createMou(input: MouInput) {
  const { error } = await supabase.from("mous").insert(input);
  if (error) throw error;
}

export async function updateMou(id: string, input: MouInput) {
  const { error } = await supabase
    .from("mous")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Sisa hari sampai expiry (negatif = sudah lewat). null kalau tidak ada tanggal. */
export function daysLeft(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const end = new Date(expiry + "T00:00:00");
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export function daysLeftClassName(days: number | null): string {
  if (days === null) return "text-muted-foreground";
  if (days < 7) return "font-bold text-red-700";
  if (days < 30) return "text-red-500";
  return "";
}

export function daysLeftLabel(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  return `${days} hari`;
}
