import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type Speaker = Database["public"]["Tables"]["speakers"]["Row"];
export type EventSpeaker = Database["public"]["Tables"]["event_speakers"]["Row"];

export const EVENT_TYPES = [
  "Flagship",
  "Workshop",
  "Talkshow",
  "Internal",
  "Competition",
  "Other",
] as const;

export const EVENT_STATUSES = [
  "Planning",
  "Preparation",
  "Live",
  "Done",
  "Cancelled",
] as const;

export const EVENT_TYPE_META: Record<string, { label: string; className: string }> = {
  Flagship: { label: "Flagship", className: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  Workshop: { label: "Workshop", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  Talkshow: { label: "Talkshow", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  Internal: { label: "Internal", className: "bg-slate-400/10 text-slate-600 border-slate-400/30" },
  Competition: { label: "Kompetisi", className: "bg-red-500/10 text-red-700 border-red-500/30" },
  Other: { label: "Lainnya", className: "bg-slate-700/10 text-slate-800 border-slate-700/30" },
};

export const EVENT_STATUS_META: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  Planning: { label: "Planning", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
  Preparation: { label: "Persiapan", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  Live: { label: "Live", className: "bg-green-600/10 text-green-700 border-green-600/30", pulse: true },
  Done: { label: "Selesai", className: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  Cancelled: { label: "Dibatalkan", className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export const FEE_STATUSES = ["Not_Applicable", "Pending", "Paid"] as const;
export const FEE_STATUS_LABELS: Record<string, string> = {
  Not_Applicable: "Tidak Berlaku",
  Pending: "Belum Dibayar",
  Paid: "Sudah Dibayar",
};

export const CONFIRMATION_STATUSES = ["Invited", "Confirmed", "Declined", "Cancelled"] as const;
export const CONFIRMATION_META: Record<string, { label: string; className: string }> = {
  Invited: { label: "Diundang", className: "bg-slate-500/10 text-slate-700 border-slate-500/30" },
  Confirmed: { label: "Konfirmasi", className: "bg-green-600/10 text-green-700 border-green-600/30" },
  Declined: { label: "Menolak", className: "bg-destructive/10 text-destructive border-destructive/30" },
  Cancelled: { label: "Dibatalkan", className: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
};

export const EVENT_TIMELINE = ["Planning", "Preparation", "Live", "Done"] as const;

/** Divisi EVT + Ketua/Waketu/Supervisor boleh mengelola event & speaker. */
export function canManageEvents(profile?: { role?: string | null; division?: string | null } | null) {
  if (!profile) return false;
  if (["Ketua", "Waketu", "Supervisor"].includes(profile.role ?? "")) return true;
  return (profile.division ?? "").toUpperCase() === "EVT";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** "12-14 Sep 2026" untuk multi-hari, "15 Sep 2026" untuk satu hari. */
export function formatEventDate(start?: string | null, end?: string | null) {
  if (!start) return "-";
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "-";
  const sd = s.getDate();
  const sm = MONTHS_ID[s.getMonth()];
  const sy = s.getFullYear();
  if (!end || end === start) return `${sd} ${sm} ${sy}`;
  const e = new Date(end);
  if (Number.isNaN(e.getTime())) return `${sd} ${sm} ${sy}`;
  const ed = e.getDate();
  const em = MONTHS_ID[e.getMonth()];
  const ey = e.getFullYear();
  if (sy === ey && sm === em) return `${sd}-${ed} ${sm} ${sy}`;
  if (sy === ey) return `${sd} ${sm} - ${ed} ${em} ${sy}`;
  return `${sd} ${sm} ${sy} - ${ed} ${em} ${ey}`;
}

export function formatDateTimeID(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/* ---------------- storage ---------------- */

const urlCache = new Map<string, string>();

export async function storageUrl(bucket: string, path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const key = `${bucket}:${path}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (!data?.signedUrl) {
    const pub = supabase.storage.from(bucket).getPublicUrl(path);
    return pub.data?.publicUrl ?? null;
  }
  urlCache.set(key, data.signedUrl);
  return data.signedUrl;
}

export async function uploadFile(bucket: string, folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/* ---------------- events ---------------- */

export type EventWithRelations = EventRow & {
  profiles?: { id: string; full_name: string; photo_url: string | null } | null;
};

const EVENT_SELECT = "*, profiles:pic_id(id,full_name,photo_url)";

export async function fetchEvents(): Promise<EventWithRelations[]> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .order("date_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventWithRelations[];
}

export async function fetchEvent(id: string): Promise<EventWithRelations | null> {
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as EventWithRelations | null;
}

export type EventInput = {
  name: string;
  slug: string;
  description: string | null;
  event_type: string;
  date_start: string | null;
  date_end: string | null;
  venue: string | null;
  venue_address: string | null;
  pic_id: string | null;
  target_attendees: number | null;
  actual_attendees?: number | null;
  budget_idr: number | null;
  actual_spend_idr?: number | null;
  status: string;
  poster_url: string | null;
  notes: string | null;
};

export async function createEvent(input: EventInput) {
  const { data, error } = await supabase.from("events").insert(input).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const { error } = await supabase
    .from("events")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- speakers ---------------- */

export type SpeakerWithRelations = Speaker & {
  companies?: { id: string; name: string } | null;
  people?: { id: string; full_name: string } | null;
};

const SPEAKER_SELECT =
  "*, companies:company_id(id,name), people:contact_person_id(id,full_name)";

export async function fetchSpeakers(): Promise<SpeakerWithRelations[]> {
  const { data, error } = await supabase
    .from("speakers")
    .select(SPEAKER_SELECT)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SpeakerWithRelations[];
}

export async function fetchSpeaker(id: string): Promise<SpeakerWithRelations | null> {
  const { data, error } = await supabase
    .from("speakers")
    .select(SPEAKER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as SpeakerWithRelations | null;
}

export type SpeakerInput = {
  full_name: string;
  title: string | null;
  expertise: string | null;
  bio_short: string | null;
  photo_url: string | null;
  cv_url: string | null;
  default_rate_idr: number | null;
  company_id: string | null;
  contact_person_id: string | null;
  direct_email: string | null;
  direct_phone: string | null;
  notes: string | null;
};

export async function createSpeaker(input: SpeakerInput) {
  const { data, error } = await supabase.from("speakers").insert(input).select("*").single();
  if (error) throw error;
  return data as Speaker;
}

export async function updateSpeaker(id: string, input: Partial<SpeakerInput>) {
  const { error } = await supabase
    .from("speakers")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSpeaker(id: string) {
  const { error } = await supabase.from("speakers").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- event_speakers ---------------- */

export type EventSpeakerWithRelations = EventSpeaker & {
  speakers?: SpeakerWithRelations | null;
  events?: { id: string; name: string; date_start: string | null; status: string } | null;
};

export async function fetchEventSpeakers(eventId: string): Promise<EventSpeakerWithRelations[]> {
  const { data, error } = await supabase
    .from("event_speakers")
    .select(`*, speakers:speaker_id(${"*, companies:company_id(id,name)"})`)
    .eq("event_id", eventId);
  if (error) throw error;
  return (data ?? []) as EventSpeakerWithRelations[];
}

export async function fetchSpeakerEvents(speakerId: string): Promise<EventSpeakerWithRelations[]> {
  const { data, error } = await supabase
    .from("event_speakers")
    .select("*, events:event_id(id,name,date_start,status)")
    .eq("speaker_id", speakerId);
  if (error) throw error;
  return (data ?? []) as EventSpeakerWithRelations[];
}

export async function fetchSpeakerEventCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("event_speakers").select("speaker_id");
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { speaker_id: string }[]) {
    map[row.speaker_id] = (map[row.speaker_id] ?? 0) + 1;
  }
  return map;
}

export type EventSpeakerInput = {
  event_id: string;
  speaker_id: string;
  session_title: string | null;
  session_time_start: string | null;
  session_time_end: string | null;
  fee_idr: number | null;
  fee_status: string;
  confirmation_status: string;
  tor_url: string | null;
  notes: string | null;
};

export async function addEventSpeaker(input: EventSpeakerInput) {
  const { error } = await supabase.from("event_speakers").insert(input);
  if (error) throw error;
}

export async function updateEventSpeaker(id: string, input: Partial<EventSpeakerInput>) {
  const { error } = await supabase.from("event_speakers").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEventSpeaker(id: string) {
  const { error } = await supabase.from("event_speakers").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- relasi keuangan & sponsorship ---------------- */

export async function fetchEventDeals(eventId: string) {
  const { data, error } = await supabase
    .from("deals")
    .select("*, companies:company_id(id,name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function fetchEventTransactions(eventId: string) {
  const { data, error } = await supabase
    .from("fund_transactions")
    .select("*, transaction_categories:category_id(id,name)")
    .eq("related_event_id", eventId)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export type EventStats = {
  speakerCount: number;
  sponsorshipTotal: number;
  expenseTotal: number;
};

export async function fetchEventStats(eventId: string): Promise<EventStats> {
  const [speakers, deals, transactions] = await Promise.all([
    fetchEventSpeakers(eventId),
    fetchEventDeals(eventId).catch(() => [] as any[]),
    fetchEventTransactions(eventId).catch(() => [] as any[]),
  ]);
  return {
    speakerCount: speakers.length,
    sponsorshipTotal: deals
      .filter((d) => d.stage === "Deal")
      .reduce((s, d) => s + Number(d.value_idr ?? 0), 0),
    expenseTotal: transactions
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + Number(t.amount_idr ?? 0), 0),
  };
}

/* ============ Rundown Event ============ */

export type RundownItem = {
  id: string;
  event_id: string;
  time_start: string | null;
  time_end: string | null;
  activity: string;
  pic_id: string | null;
  notes: string | null;
  sort_order: number | null;
  created_at: string | null;
  profiles?: { id: string; full_name: string; division: string | null; photo_url: string | null } | null;
};

export type RundownInput = {
  event_id: string;
  time_start: string | null;
  time_end: string | null;
  activity: string;
  pic_id: string | null;
  notes: string | null;
  sort_order: number;
};

export async function fetchRundown(eventId: string): Promise<RundownItem[]> {
  const { data, error } = await supabase
    .from("event_rundowns")
    .select("*, profiles:pic_id(id,full_name,division,photo_url)")
    .eq("event_id", eventId);
  if (error) throw error;
  const rows = (data ?? []) as unknown as RundownItem[];
  return rows.sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (so !== 0) return so;
    return new Date(a.time_start ?? 0).getTime() - new Date(b.time_start ?? 0).getTime();
  });
}

export async function createRundown(input: RundownInput) {
  const { error } = await supabase.from("event_rundowns").insert(input);
  if (error) throw error;
}

export async function updateRundown(id: string, input: Partial<RundownInput>) {
  const { error } = await supabase.from("event_rundowns").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteRundown(id: string) {
  const { error } = await supabase.from("event_rundowns").delete().eq("id", id);
  if (error) throw error;
}

/** "09:00" 24 jam. */
export function formatTimeID(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "12 Sep 2026" untuk penanda hari pada event multi-hari. */
export function formatDayID(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** Label dropdown event: "Nama - 12 Sep 2026". */
export function eventOptionLabel(e: { name: string; date_start?: string | null; date_end?: string | null }) {
  const d = formatEventDate(e.date_start, e.date_end);
  return d === "-" ? e.name : `${e.name} - ${d}`;
}
