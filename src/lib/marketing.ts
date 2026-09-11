import { supabase } from "@/lib/supabase-external";

/* ===================== Enum & konstanta ===================== */

export const CONTENT_PLATFORMS = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "X",
  "WhatsApp",
  "YouTube",
  "Website",
  "Lainnya",
] as const;
export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];

export const CONTENT_FORMATS = [
  "Feed_Tunggal",
  "Carousel",
  "Reels",
  "Story",
  "Video_Panjang",
  "Thread",
  "Artikel",
  "Lainnya",
] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_STATUSES = [
  "Ide",
  "Draf",
  "Perlu_Desain",
  "Review",
  "Disetujui",
  "Terjadwal",
  "Tayang",
  "Dibatalkan",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Kolom papan status (tanpa Dibatalkan). */
export const CONTENT_BOARD_STATUSES = CONTENT_STATUSES.filter(
  (s) => s !== "Dibatalkan",
) as ContentStatus[];

export const CONTENT_TIMELINE = CONTENT_BOARD_STATUSES;

export const DESIGN_STATUSES = [
  "Baru",
  "Diambil",
  "Dikerjakan",
  "Review",
  "Revisi",
  "Selesai",
  "Ditolak",
] as const;
export type DesignStatus = (typeof DESIGN_STATUSES)[number];

export const DESIGN_BOARD_STATUSES: DesignStatus[] = [
  "Baru",
  "Diambil",
  "Dikerjakan",
  "Review",
  "Revisi",
  "Selesai",
];

export const DESIGN_TYPES = [
  "Poster",
  "Feed_IG",
  "Story_IG",
  "Carousel",
  "Banner",
  "Sertifikat",
  "Deck",
  "Merchandise",
  "Spanduk",
  "Lainnya",
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const label = (v?: string | null) => (v ? v.replace(/_/g, " ") : "-");

export const PLATFORM_SHORT: Record<string, string> = {
  Instagram: "IG",
  TikTok: "TT",
  LinkedIn: "LI",
  X: "X",
  WhatsApp: "WA",
  YouTube: "YT",
  Website: "WEB",
  Lainnya: "—",
};

export const FORMATS_BY_PLATFORM: Record<string, ContentFormat[]> = {
  Instagram: ["Feed_Tunggal", "Carousel", "Reels", "Story"],
  TikTok: ["Reels", "Video_Panjang"],
  LinkedIn: ["Feed_Tunggal", "Carousel", "Artikel"],
  X: ["Thread", "Feed_Tunggal"],
  WhatsApp: ["Feed_Tunggal", "Story"],
  YouTube: ["Video_Panjang", "Reels"],
  Website: ["Artikel", "Lainnya"],
  Lainnya: [...CONTENT_FORMATS],
};

/** Batas ideal karakter caption per platform. */
export const CAPTION_LIMITS: Record<string, number> = {
  Instagram: 2200,
  TikTok: 2200,
  LinkedIn: 3000,
  X: 280,
  WhatsApp: 1024,
  YouTube: 5000,
  Website: 5000,
  Lainnya: 2200,
};

export const CONTENT_STATUS_META: Record<string, { label: string; className: string }> = {
  Ide: { label: "Ide", className: "bg-muted text-muted-foreground border-border" },
  Draf: { label: "Draf", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  Perlu_Desain: {
    label: "Perlu Desain",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  Review: { label: "Review", className: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  Disetujui: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Terjadwal: { label: "Terjadwal", className: "bg-blue-100 text-blue-800 border-blue-200" },
  Tayang: { label: "Tayang", className: "bg-emerald-600 text-white border-emerald-700" },
  Dibatalkan: {
    label: "Dibatalkan",
    className: "bg-rose-50 text-rose-700 border-rose-200 line-through",
  },
};

export const DESIGN_STATUS_META: Record<string, { label: string; className: string }> = {
  Baru: { label: "Baru", className: "bg-muted text-muted-foreground border-border" },
  Diambil: { label: "Diambil", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Dikerjakan: { label: "Dikerjakan", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  Review: { label: "Review", className: "bg-yellow-100 text-yellow-900 border-yellow-300" },
  Revisi: { label: "Revisi", className: "bg-orange-100 text-orange-800 border-orange-200" },
  Selesai: { label: "Selesai", className: "bg-emerald-600 text-white border-emerald-700" },
  Ditolak: { label: "Ditolak", className: "bg-rose-100 text-rose-800 border-rose-200" },
};

export const PRIORITY_META: Record<string, { label: string; className: string }> = {
  Critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
  High: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
  Medium: { label: "Medium", className: "bg-yellow-100 text-yellow-900 border-yellow-200" },
  Low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

/* ===================== Tipe baris ===================== */

export type ContentPillar = {
  id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export type ContentPlan = {
  id: string;
  title: string;
  brief: string | null;
  platform: ContentPlatform;
  format: ContentFormat;
  pillar_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: ContentStatus;
  owner_division: string | null;
  copywriter_id: string | null;
  caption_draft: string | null;
  hashtags: string | null;
  asset_url: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  published_at: string | null;
  published_url: string | null;
  related_event_id: string | null;
  is_archived: boolean | null;
  archived_by?: string | null;
  archived_at?: string | null;
  archive_reason?: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DesignRequest = {
  id: string;
  title: string;
  brief: string;
  design_type: DesignType;
  priority: Priority;
  needed_by: string | null;
  reference_notes: string | null;
  requested_by: string;
  requester_division: string | null;
  content_plan_id: string | null;
  related_event_id: string | null;
  status: DesignStatus;
  designer_id: string | null;
  taken_at: string | null;
  result_url: string | null;
  submitted_at: string | null;
  revision_notes: string | null;
  revision_count: number | null;
  completed_at: string | null;
  reject_reason: string | null;
  is_archived: boolean | null;
  archived_by?: string | null;
  archived_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DesignWorkloadRow = {
  designer_id: string | null;
  full_name: string | null;
  sedang_dikerjakan: number | null;
  total_selesai: number | null;
  lewat_tenggat: number | null;
};

export type ContentSummaryRow = {
  bulan: string | null;
  platform: ContentPlatform | null;
  pilar: string | null;
  jumlah: number | null;
  sudah_tayang: number | null;
};

/* ===================== Wewenang (pre-filter UI) ===================== */

export const CREATIVE_DIVISION = "KRD";
const BPH_ROLES = ["Ketua", "Waketu", "Supervisor"];

export function isKrd(division?: string | null) {
  return division === CREATIVE_DIVISION;
}

export function isBph(role?: string | null) {
  return !!role && BPH_ROLES.includes(role);
}

/** Boleh kelola kalender konten (buat/ubah). */
export function canManageContent(role?: string | null, division?: string | null) {
  return isBph(role) || isKrd(division);
}

/** Boleh menyetujui konten pada tahap Review. */
export function canReviewContent(
  role: string | null | undefined,
  division: string | null | undefined,
  ownerDivision: string | null | undefined,
) {
  if (isBph(role)) return true;
  return role === "Kadiv" && !!ownerDivision && ownerDivision === division;
}

/** Kadiv divisi kreatif — boleh menolak permintaan desain. */
export function canRejectDesign(role?: string | null, division?: string | null) {
  return isBph(role) || (role === "Kadiv" && isKrd(division));
}

/* ===================== Query: pilar ===================== */

export async function fetchPillars(): Promise<ContentPillar[]> {
  const { data, error } = await supabase
    .from("content_pillars")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContentPillar[];
}

/* ===================== Query: konten ===================== */

export async function fetchContentPlans(includeArchived = false): Promise<ContentPlan[]> {
  let q = supabase.from("content_plans").select("*");
  if (!includeArchived) q = q.eq("is_archived", false);
  const { data, error } = await q
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentPlan[];
}

export async function fetchContentPlan(id: string): Promise<ContentPlan | null> {
  const { data, error } = await supabase
    .from("content_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ContentPlan | null;
}

export async function fetchContentPlansByEvent(eventId: string): Promise<ContentPlan[]> {
  const { data, error } = await supabase
    .from("content_plans")
    .select("*")
    .eq("related_event_id", eventId)
    .eq("is_archived", false)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContentPlan[];
}

export async function createContentPlan(payload: Partial<ContentPlan>) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("content_plans")
    .insert({ ...payload, created_by: userData.user?.id ?? null } as never)
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateContentPlan(id: string, patch: Partial<ContentPlan>) {
  const { error } = await supabase
    .from("content_plans")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

/* ===================== Query: permintaan desain ===================== */

export async function fetchDesignRequests(includeArchived = false): Promise<DesignRequest[]> {
  let q = supabase.from("design_requests").select("*");
  if (!includeArchived) q = q.eq("is_archived", false);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DesignRequest[];
}

export async function fetchDesignRequestsByContent(contentId: string): Promise<DesignRequest[]> {
  const { data, error } = await supabase
    .from("design_requests")
    .select("*")
    .eq("content_plan_id", contentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DesignRequest[];
}

export async function fetchDesignRequestsByEvent(eventId: string): Promise<DesignRequest[]> {
  const { data, error } = await supabase
    .from("design_requests")
    .select("*")
    .eq("related_event_id", eventId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DesignRequest[];
}

export async function createDesignRequest(payload: {
  title: string;
  brief: string;
  design_type: DesignType;
  priority: Priority;
  needed_by: string;
  reference_notes?: string | null;
  content_plan_id?: string | null;
  related_event_id?: string | null;
  requester_division?: string | null;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan.");
  const { data, error } = await supabase
    .from("design_requests")
    .insert({ ...payload, requested_by: uid } as never)
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateDesignRequest(id: string, patch: Partial<DesignRequest>) {
  const { error } = await supabase
    .from("design_requests")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function takeDesignRequest(id: string) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan.");
  const { error } = await supabase
    .from("design_requests")
    .update({ designer_id: uid, taken_at: new Date().toISOString(), status: "Diambil" } as never)
    .eq("id", id)
    .is("designer_id", null);
  if (error) throw error;
}

export async function createDesignRequestFromContent(params: {
  contentId: string;
  designType: DesignType;
  neededBy: string | null;
  extraBrief?: string | null;
}) {
  const { data, error } = await supabase.rpc("create_design_request_from_content", {
    p_content_id: params.contentId,
    p_design_type: params.designType,
    p_needed_by: params.neededBy,
    p_extra_brief: params.extraBrief?.trim() ? params.extraBrief.trim() : null,
  } as never);
  if (error) throw error;
  return data as unknown as string;
}

/* ===================== Query: view ringkasan ===================== */

export async function fetchDesignWorkload(): Promise<DesignWorkloadRow[]> {
  const { data, error } = await supabase.from("design_workload").select("*");
  if (error) throw error;
  return (data ?? []) as DesignWorkloadRow[];
}

export async function fetchContentSummary(): Promise<ContentSummaryRow[]> {
  const { data, error } = await supabase.from("content_calendar_summary").select("*");
  if (error) throw error;
  return (data ?? []) as ContentSummaryRow[];
}

/* ===================== Utilitas ===================== */

export function isImageUrl(url?: string | null) {
  return !!url && /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url);
}

export function toDateKey(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatTimeID(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

/** Selisih hari dari hari ini (negatif = sudah lewat). */
export function daysFromToday(dateStr?: string | null) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
