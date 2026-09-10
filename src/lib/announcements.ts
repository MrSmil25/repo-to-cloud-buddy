import { supabase } from "@/lib/supabase-external";

/**
 * Tabel pengumuman & pengaturan organisasi belum tercakup di tipe Supabase hasil
 * generate, jadi akses dilakukan lewat klien tanpa tipe dan dipetakan ke tipe lokal.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export const ANNOUNCEMENT_LEVELS = ["Mendesak", "Penting", "Info"] as const;
export type AnnouncementLevel = (typeof ANNOUNCEMENT_LEVELS)[number];

export const ANNOUNCEMENT_SCOPES = ["Organisasi", "Divisi"] as const;
export type AnnouncementScope = (typeof ANNOUNCEMENT_SCOPES)[number];

export type Announcement = {
  id: string;
  title: string;
  body: string;
  level: string;
  scope: string;
  target_division: string | null;
  related_event_id: string | null;
  author_id: string | null;
  requires_ack: boolean;
  published_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type ReadStatusRow = {
  announcement_id: string;
  title: string | null;
  scope: string | null;
  target_division: string | null;
  requires_ack: boolean | null;
  total_target: number | null;
  total_read: number | null;
};

export type EventOption = { id: string; name: string; date_start: string | null };

export const LEVEL_META: Record<
  string,
  { accent: string; badge: string; label: string }
> = {
  Mendesak: {
    accent: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    label: "Mendesak",
  },
  Penting: {
    accent: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
    label: "Penting",
  },
  Info: {
    accent: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/30",
    label: "Info",
  },
};

const LEVEL_ORDER: Record<string, number> = { Mendesak: 0, Penting: 1, Info: 2 };

export function sortAnnouncements(rows: Announcement[]): Announcement[] {
  return [...rows].sort((a, b) => {
    const lv = (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9);
    if (lv !== 0) return lv;
    const ta = new Date(a.published_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.published_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await db
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${today()}`);
  if (error) throw error;
  return sortAnnouncements((data ?? []) as Announcement[]);
}

export async function fetchMyReadIds(userId: string): Promise<string[]> {
  const { data, error } = await db
    .from("announcement_reads")
    .select("announcement_id")
    .eq("reader_id", userId);
  if (error) throw error;
  return ((data ?? []) as { announcement_id: string }[]).map((r) => r.announcement_id);
}

export async function markAsRead(announcementId: string, userId: string) {
  const { error } = await db
    .from("announcement_reads")
    .insert({ announcement_id: announcementId, reader_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function fetchReadStatus(): Promise<ReadStatusRow[]> {
  const { data, error } = await db.from("announcement_read_status").select("*");
  if (error) return [];
  return (data ?? []) as ReadStatusRow[];
}

export async function fetchReaders(announcementId: string): Promise<
  { reader_id: string; read_at: string | null }[]
> {
  const { data, error } = await db
    .from("announcement_reads")
    .select("reader_id, read_at")
    .eq("announcement_id", announcementId);
  if (error) throw error;
  return (data ?? []) as { reader_id: string; read_at: string | null }[];
}

export async function fetchActiveEvents(): Promise<EventOption[]> {
  const { data, error } = await db
    .from("events")
    .select("id, name, date_start")
    .order("date_start", { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []) as EventOption[];
}

export type AnnouncementInput = {
  title: string;
  body: string;
  level: string;
  scope: string;
  target_division: string | null;
  related_event_id: string | null;
  requires_ack: boolean;
  expires_at: string | null;
};

export async function createAnnouncement(input: AnnouncementInput, authorId: string) {
  const { error } = await db.from("announcements").insert({
    ...input,
    author_id: authorId,
    published_at: new Date().toISOString(),
    is_active: true,
  });
  if (error) throw error;
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>) {
  const { error } = await db.from("announcements").update(input).eq("id", id);
  if (error) throw error;
}

/** Soft delete / arsip: pengumuman tidak dihapus, hanya dinonaktifkan. */
export async function deactivateAnnouncement(id: string) {
  const { error } = await db.from("announcements").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function archiveAnnouncement(id: string) {
  const { error } = await db
    .from("announcements")
    .update({ is_active: false, expires_at: today() })
    .eq("id", id);
  if (error) throw error;
}

export type OrgSettings = {
  id: number;
  org_name: string;
  org_code: string;
  org_address: string | null;
  org_email: string | null;
  org_phone: string | null;
  logo_url: string | null;
  active_period: string | null;
};

export async function fetchOrgSettings(): Promise<OrgSettings | null> {
  const { data, error } = await db.from("org_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return null;
  return (data ?? null) as OrgSettings | null;
}

export async function updateOrgSettings(input: Partial<OrgSettings>) {
  const { error } = await db.from("org_settings").update(input).eq("id", 1);
  if (error) throw error;
}

/** Logo disimpan di bucket privat "documents", jadi butuh URL bertanda tangan. */
export async function resolveLogoUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
