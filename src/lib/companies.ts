import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Person = Database["public"]["Tables"]["people"]["Row"];
export type CompanyType = Database["public"]["Enums"]["company_type"];
export type CompanyStatus = Database["public"]["Enums"]["company_status"];
export type ContactRole = Database["public"]["Enums"]["contact_role"];
export type ContactChannel = Database["public"]["Enums"]["contact_channel"];

export const COMPANY_TYPES: CompanyType[] = [
  "Sponsor",
  "Media",
  "Speaker_Source",
  "Institutional",
  "Vendor",
];

export const COMPANY_STATUSES: CompanyStatus[] = [
  "Cold",
  "Warm",
  "Active",
  "Dormant",
  "Blacklist",
];

export const CONTACT_ROLES: ContactRole[] = [
  "Decision_Maker",
  "Influencer",
  "Executor",
  "Gatekeeper",
];

export const CONTACT_CHANNELS: ContactChannel[] = ["WA", "Email", "Phone"];

export const TYPE_META: Record<string, { label: string; className: string }> = {
  Sponsor: { label: "Sponsor", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  Media: { label: "Media", className: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  Speaker_Source: {
    label: "Sumber Pembicara",
    className: "bg-red-500/10 text-red-700 border-red-500/30",
  },
  Institutional: {
    label: "Institusi",
    className: "bg-green-600/10 text-green-700 border-green-600/30",
  },
  Vendor: { label: "Vendor", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
};

export const STATUS_META: Record<string, { label: string; className: string }> = {
  Cold: { label: "Cold", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
  Warm: { label: "Warm", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  Active: { label: "Aktif", className: "bg-green-600/10 text-green-700 border-green-600/30" },
  Dormant: { label: "Dormant", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  Blacklist: { label: "Blacklist", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  Decision_Maker: "Pengambil Keputusan",
  Influencer: "Pemberi Pengaruh",
  Executor: "Pelaksana",
  Gatekeeper: "Penjaga Akses",
};

export const CONTACT_CHANNEL_LABELS: Record<string, string> = {
  WA: "WhatsApp",
  Email: "Email",
  Phone: "Telepon",
};

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCompany(id: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export type CompanyInput = {
  name: string;
  type: CompanyType;
  industry: string | null;
  website: string | null;
  city: string | null;
  notes: string | null;
  owner_division: string | null;
  overall_status: CompanyStatus;
};

export async function createCompany(input: CompanyInput) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...input, created_by: userData.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, input: CompanyInput) {
  const { error } = await supabase
    .from("companies")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchPeople(companyId: string): Promise<Person[]> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type PersonInput = {
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  role_in_relation: ContactRole | null;
  preferred_channel: ContactChannel | null;
};

export async function createPerson(companyId: string, input: PersonInput) {
  const { error } = await supabase.from("people").insert({ ...input, company_id: companyId });
  if (error) throw error;
}

export async function updatePerson(id: string, input: PersonInput) {
  const { error } = await supabase
    .from("people")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePerson(id: string) {
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw error;
}
