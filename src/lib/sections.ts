import { supabase } from "@/lib/supabase-external";

export type SectionSetting = {
  section_key: string;
  label: string;
  hidden_for_roles: string[] | null;
  sort_order: number | null;
};

export type SectionOverride = {
  id: string;
  section_key: string;
  division: string;
  is_hidden: boolean;
};

/** Role yang selalu melihat semua section. */
export const ALWAYS_VISIBLE_ROLES = ["Ketua", "Waketu", "Supervisor"];

/** Role yang boleh disembunyikan lewat pengaturan. */
export const HIDEABLE_ROLES = ["Anggota", "Kadiv", "Sekretaris", "Controller"];

export function canManageSections(role?: string | null) {
  return !!role && [...ALWAYS_VISIBLE_ROLES, "Kadiv"].includes(role);
}

export function canManageOrgSections(role?: string | null) {
  return !!role && ALWAYS_VISIBLE_ROLES.includes(role);
}

export async function fetchSectionSettings(): Promise<SectionSetting[]> {
  const { data, error } = await supabase
    .from("section_settings")
    .select("section_key,label,hidden_for_roles,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SectionSetting[];
}

export async function fetchSectionOverrides(): Promise<SectionOverride[]> {
  const { data, error } = await supabase
    .from("division_section_overrides")
    .select("id,section_key,division,is_hidden");
  if (error) throw error;
  return (data ?? []) as SectionOverride[];
}

/** Apakah satu section terlihat untuk role + divisi tertentu. */
export function isSectionVisible(
  sectionKey: string,
  opts: {
    role?: string | null;
    division?: string | null;
    settings?: SectionSetting[] | null;
    overrides?: SectionOverride[] | null;
  },
) {
  const { role, division, settings, overrides } = opts;
  if (role && ALWAYS_VISIBLE_ROLES.includes(role)) return true;

  const override = division
    ? (overrides ?? []).find((o) => o.section_key === sectionKey && o.division === division)
    : undefined;
  if (override) return !override.is_hidden;

  const setting = (settings ?? []).find((s) => s.section_key === sectionKey);
  if (!setting) return true;
  return !(role && (setting.hidden_for_roles ?? []).includes(role));
}

export async function setHiddenRoles(sectionKey: string, roles: string[]) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("section_settings")
    .update({
      hidden_for_roles: roles,
      configured_by: userData.user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("section_key", sectionKey);
  if (error) throw error;
}

/** is_hidden === null berarti "Ikut Organisasi" (hapus override). */
export async function setDivisionOverride(
  sectionKey: string,
  division: string,
  isHidden: boolean | null,
) {
  const { data: userData } = await supabase.auth.getUser();
  if (isHidden === null) {
    const { error } = await supabase
      .from("division_section_overrides")
      .delete()
      .eq("section_key", sectionKey)
      .eq("division", division);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("division_section_overrides").upsert(
    {
      section_key: sectionKey,
      division,
      is_hidden: isHidden,
      configured_by: userData.user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "section_key,division" },
  );
  if (error) throw error;
}
