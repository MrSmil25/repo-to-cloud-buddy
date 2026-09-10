import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type DealType = Database["public"]["Enums"]["deal_type"];
export type DealStage = Database["public"]["Enums"]["deal_stage"];

export const DEAL_TYPES: DealType[] = [
  "Sponsorship",
  "Media_Partnership",
  "Speaker",
  "Institutional_MoU",
  "In_kind",
];

export const DEAL_TYPE_LABELS: Record<string, string> = {
  Sponsorship: "Sponsorship",
  Media_Partnership: "Media Partner",
  Speaker: "Pembicara",
  Institutional_MoU: "MoU Institusi",
  In_kind: "In-kind",
};

export const DEAL_STAGES: DealStage[] = [
  "Prospect",
  "Contacted",
  "Pitched",
  "Negotiating",
  "Deal",
  "Rejected",
  "Ghosted",
];

export const STAGE_META: Record<
  string,
  { label: string; header: string; badge: string }
> = {
  Prospect: {
    label: "Prospect",
    header: "bg-slate-200 text-slate-700",
    badge: "bg-slate-500/10 text-slate-700 border-slate-500/30",
  },
  Contacted: {
    label: "Contacted",
    header: "bg-sky-200 text-sky-800",
    badge: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  },
  Pitched: {
    label: "Pitched",
    header: "bg-blue-500 text-white",
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  },
  Negotiating: {
    label: "Negotiating",
    header: "bg-amber-300 text-amber-900",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  Deal: {
    label: "Deal",
    header: "bg-green-600 text-white",
    badge: "bg-green-600/10 text-green-700 border-green-600/30",
  },
  Rejected: {
    label: "Rejected",
    header: "bg-red-600 text-white",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
  },
  Ghosted: {
    label: "Ghosted",
    header: "bg-slate-700 text-white",
    badge: "bg-slate-700/10 text-slate-700 border-slate-700/30",
  },
};

export type DealWithRelations = Deal & {
  companies?: { id: string; name: string } | null;
  profiles?: { id: string; full_name: string; photo_url: string | null } | null;
  events?: { id: string; name: string } | null;
};

const SELECT =
  "*, companies:company_id(id,name), profiles:owner_person_id(id,full_name,photo_url), events:event_id(id,name)";

export async function fetchDeals(): Promise<DealWithRelations[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}

export async function fetchDealsByCompany(companyId: string): Promise<DealWithRelations[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(SELECT)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DealWithRelations[];
}

export type DealInput = {
  name: string;
  deal_type: DealType;
  company_id: string | null;
  primary_contact_id: string | null;
  owner_division: string | null;
  owner_person_id: string | null;
  stage: DealStage;
  value_idr: number | null;
  deliverables: string | null;
  deadline: string | null;
  event_id: string | null;
  notes: string | null;
};

export async function createDeal(input: DealInput) {
  const { error } = await supabase.from("deals").insert(input);
  if (error) throw error;
}

export async function updateDealStage(id: string, stage: DealStage) {
  const { error } = await supabase
    .from("deals")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchEventOptions() {
  const { data, error } = await supabase
    .from("events")
    .select("id,name,date_start,date_end")
    .order("date_start", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPeopleByCompany(companyId: string) {
  const { data, error } = await supabase
    .from("people")
    .select("id,full_name")
    .eq("company_id", companyId)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
