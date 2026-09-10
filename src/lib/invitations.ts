import { supabase } from "@/lib/supabase-external";

export type InviteKind = "Kode_Divisi" | "Link_Personal";

export type Invitation = {
  id: string;
  kind: InviteKind;
  code: string;
  division: string | null;
  default_role: string | null;
  intended_name: string | null;
  intended_email: string | null;
  assigned_role: string | null;
  assigned_division: string | null;
  max_uses: number | null;
  used_count: number | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
};

export const USER_ROLES = [
  "Anggota",
  "Kadiv",
  "Waketu",
  "Ketua",
  "Sekretaris",
  "Controller",
  "Supervisor",
] as const;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomString(length: number) {
  let out = "";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  } else {
    for (let i = 0; i < length; i++)
      out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateDivisionCode(divisionCode: string) {
  const prefix = (divisionCode || "ORG").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `${prefix || "ORG"}-${new Date().getFullYear()}-${randomString(3)}`;
}

export function generatePersonalToken() {
  return `INV-${randomString(6)}-${randomString(6)}-${randomString(6)}`;
}

export function registerLink(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/register?code=${encodeURIComponent(code)}`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export type ValidateInviteResult = {
  valid: boolean;
  message: string | null;
  division: string | null;
  role: string | null;
  intended_email: string | null;
};

export async function validateInvite(code: string): Promise<ValidateInviteResult | null> {
  const { data, error } = await supabase.rpc("validate_invite", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ValidateInviteResult) ?? null;
}

export async function claimInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("claim_invite", { p_code: code });
  if (error) throw error;
  return String(data ?? "INVALID");
}
