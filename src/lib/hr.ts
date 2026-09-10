import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

/* ---------- Peran ---------- */

export function isKadiv(role?: string | null) {
  return role === "Kadiv";
}

/** Ketua, Waketu, Sekretaris, Controller, Supervisor dianggap pengurus inti. */
export function isBPHOrSupervisor(role?: string | null) {
  return !!role && ["Ketua", "Waketu", "Sekretaris", "Controller", "Supervisor"].includes(role);
}

/* ---------- Rapor Anggota ---------- */

export type MemberReport = {
  member_id: string;
  full_name: string;
  division: string | null;
  role: string;
  tasks_total: number;
  tasks_done: number;
  tasks_overdue: number;
  tasks_blocked: number;
  completion_rate: number;
  avg_days_late: number;
  meetings_total: number;
  meetings_hadir: number;
  meetings_alpa: number;
  attendance_rate: number;
  assignments_total: number;
  assignments_submitted: number;
  submission_rate: number;
  kas_total: number;
  kas_lunas: number;
  kas_rate: number;
  kr_owned: number;
  kr_avg_progress: number;
  deals_owned: number;
  deals_closed: number;
  deals_value: number;
};

export async function fetchMemberReport(member: string, start: string, end: string) {
  const { data, error } = await db.rpc("member_report", {
    p_member: member,
    p_start: start,
    p_end: end,
  });
  if (error) throw error;
  const rows = (data ?? []) as MemberReport[];
  return rows[0] ?? null;
}

/* ---------- Peta Beban Kerja ---------- */

export type WorkloadRow = {
  member_id: string;
  full_name: string;
  division: string | null;
  role: string;
  beban_aktif: number | null;
  beban_prioritas_tinggi: number | null;
  tunggakan: number | null;
  macet: number | null;
};

export async function fetchWorkload() {
  const { data, error } = await db.from("workload_distribution").select("*");
  if (error) throw error;
  return (data ?? []) as WorkloadRow[];
}

/* ---------- Pelacak Penyumbat ---------- */

export type BlockerRow = {
  penyumbat_id: string;
  penyumbat_nama: string;
  penyumbat_divisi: string | null;
  jumlah_task_macet: number | null;
  macet_sejak_terlama: string | null;
  hari_terlama: number | null;
};

export async function fetchBlockers() {
  const { data, error } = await db.from("blocker_summary").select("*");
  if (error) throw error;
  return (data ?? []) as BlockerRow[];
}

export type BlockedTaskRow = {
  id: string;
  title: string;
  blocked_reason: string | null;
  blocked_since: string | null;
  assignee: { full_name: string; division: string | null } | null;
};

export async function fetchBlockedTasksBy(personId: string) {
  const { data, error } = await db
    .from("tasks")
    .select("id,title,blocked_reason,blocked_since,assignee:profiles!tasks_assignee_id_fkey(full_name,division)")
    .eq("blocked_by_person_id", personId)
    .eq("status", "Blocked")
    .order("blocked_since", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BlockedTaskRow[];
}

export async function setTaskBlocked(
  id: string,
  blockedBy: string | null,
  reason: string | null,
) {
  const { error } = await db
    .from("tasks")
    .update({
      status: "Blocked",
      completed_at: null,
      blocked_by_person_id: blockedBy,
      blocked_reason: reason,
    })
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Serah Terima ---------- */

export type HoldingsRow = {
  member_id: string;
  full_name: string;
  division: string | null;
  task_aktif: number | null;
  deal_aktif: number | null;
  kr_ditanggung: number | null;
  event_dipic: number | null;
  divisi_dipimpin: number | null;
  mou_ditandatangani: number | null;
};

export async function fetchHoldings() {
  const { data, error } = await db.from("member_holdings").select("*");
  if (error) throw error;
  return (data ?? []) as HoldingsRow[];
}

export type HoldingItem = { id: string; label: string; sub?: string | null };

export type HoldingDetail = {
  tasks: HoldingItem[];
  deals: HoldingItem[];
  keyResults: HoldingItem[];
  events: HoldingItem[];
  mous: HoldingItem[];
};

export async function fetchHoldingDetail(memberId: string): Promise<HoldingDetail> {
  const [tasks, deals, krs, events, mous] = await Promise.all([
    db
      .from("tasks")
      .select("id,title,status,due_date")
      .eq("assignee_id", memberId)
      .in("status", ["Todo", "In_Progress", "Blocked"]),
    db
      .from("deals")
      .select("id,name,stage")
      .eq("owner_person_id", memberId)
      .not("stage", "in", "(Deal,Rejected,Ghosted)"),
    db
      .from("key_results")
      .select("id,title,progress_percent")
      .eq("owner_person_id", memberId),
    db.from("events").select("id,name,status").eq("pic_id", memberId),
    db.from("mous").select("id,title,status").eq("signatory_our_side_id", memberId),
  ]);
  return {
    tasks: ((tasks.data ?? []) as any[]).map((t) => ({ id: t.id, label: t.title, sub: t.status })),
    deals: ((deals.data ?? []) as any[]).map((d) => ({ id: d.id, label: d.name, sub: d.stage })),
    keyResults: ((krs.data ?? []) as any[]).map((k) => ({
      id: k.id,
      label: k.title,
      sub: `${k.progress_percent ?? 0}%`,
    })),
    events: ((events.data ?? []) as any[]).map((e) => ({ id: e.id, label: e.name, sub: e.status })),
    mous: ((mous.data ?? []) as any[]).map((m) => ({ id: m.id, label: m.title, sub: m.status })),
  };
}

export type HoldingGroup = "tasks" | "deals" | "keyResults" | "events" | "mous";

const GROUP_TARGET: Record<HoldingGroup, { table: string; column: string }> = {
  tasks: { table: "tasks", column: "assignee_id" },
  deals: { table: "deals", column: "owner_person_id" },
  keyResults: { table: "key_results", column: "owner_person_id" },
  events: { table: "events", column: "pic_id" },
  mous: { table: "mous", column: "signatory_our_side_id" },
};

export async function reassignHoldings(
  group: HoldingGroup,
  ids: string[],
  newOwner: string,
) {
  if (ids.length === 0) return;
  const target = GROUP_TARGET[group];
  const { error } = await db
    .from(target.table)
    .update({ [target.column]: newOwner })
    .in("id", ids);
  if (error) throw error;
}

/* ---------- Catatan Bimbingan ---------- */

export const COACHING_TOPICS = [
  "Reguler",
  "Beban_Kerja",
  "Kinerja",
  "Kesejahteraan",
  "Konflik",
  "Pengembangan",
  "Lainnya",
] as const;

export const COACHING_TOPIC_LABEL: Record<string, string> = {
  Reguler: "Reguler",
  Beban_Kerja: "Beban Kerja",
  Kinerja: "Kinerja",
  Kesejahteraan: "Kesejahteraan",
  Konflik: "Konflik",
  Pengembangan: "Pengembangan",
  Lainnya: "Lainnya",
};

export type CoachingNote = {
  id: string;
  member_id: string;
  coach_id: string;
  topic: string;
  discussion: string;
  agreements: string | null;
  next_checkin: string | null;
  member_acknowledged: boolean | null;
  acknowledged_at: string | null;
  created_at: string;
  member: { full_name: string; division: string | null; photo_url: string | null } | null;
  coach: { full_name: string } | null;
};

const COACHING_FIELDS =
  "id,member_id,coach_id,topic,discussion,agreements,next_checkin,member_acknowledged,acknowledged_at,created_at," +
  "member:profiles!coaching_notes_member_id_fkey(full_name,division,photo_url)," +
  "coach:profiles!coaching_notes_coach_id_fkey(full_name)";

export async function fetchCoachingNotes(filter?: {
  memberId?: string;
  coachId?: string;
}) {
  let q = db.from("coaching_notes").select(COACHING_FIELDS).order("created_at", { ascending: false });
  if (filter?.memberId) q = q.eq("member_id", filter.memberId);
  if (filter?.coachId) q = q.eq("coach_id", filter.coachId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CoachingNote[];
}

export async function createCoachingNote(input: {
  member_id: string;
  coach_id: string;
  topic: string;
  discussion: string;
  agreements: string | null;
  next_checkin: string | null;
}) {
  const { error } = await db.from("coaching_notes").insert(input);
  if (error) throw error;
}

export async function acknowledgeCoachingNote(id: string) {
  const { error } = await db
    .from("coaching_notes")
    .update({ member_acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function countUnacknowledgedCoaching(memberId: string) {
  const { count, error } = await db
    .from("coaching_notes")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .or("member_acknowledged.is.null,member_acknowledged.eq.false");
  if (error) return 0;
  return count ?? 0;
}

/* ---------- Catatan Kontribusi ---------- */

export const CONTRIBUTION_KINDS = [
  "Membantu_Rekan",
  "Inisiatif",
  "Melebihi_Ekspektasi",
  "Menutup_Kekosongan",
  "Ide_Berdampak",
  "Lainnya",
] as const;

export const CONTRIBUTION_KIND_LABEL: Record<string, string> = {
  Membantu_Rekan: "Membantu Rekan",
  Inisiatif: "Inisiatif",
  Melebihi_Ekspektasi: "Melebihi Ekspektasi",
  Menutup_Kekosongan: "Menutup Kekosongan",
  Ide_Berdampak: "Ide Berdampak",
  Lainnya: "Lainnya",
};

export type ContributionNote = {
  id: string;
  member_id: string;
  recorded_by: string;
  kind: string;
  description: string;
  related_event_id: string | null;
  related_task_id: string | null;
  visible_to_member: boolean | null;
  created_at: string;
  member: { full_name: string; division: string | null; photo_url: string | null } | null;
  recorder: { full_name: string } | null;
  event: { name: string } | null;
  task: { title: string } | null;
};

const CONTRIBUTION_FIELDS =
  "id,member_id,recorded_by,kind,description,related_event_id,related_task_id,visible_to_member,created_at," +
  "member:profiles!contribution_notes_member_id_fkey(full_name,division,photo_url)," +
  "recorder:profiles!contribution_notes_recorded_by_fkey(full_name)," +
  "event:events(name),task:tasks(title)";

export async function fetchContributions(filter?: {
  memberId?: string;
  recordedBy?: string;
  visibleOnly?: boolean;
}) {
  let q = db
    .from("contribution_notes")
    .select(CONTRIBUTION_FIELDS)
    .order("created_at", { ascending: false });
  if (filter?.memberId) q = q.eq("member_id", filter.memberId);
  if (filter?.recordedBy) q = q.eq("recorded_by", filter.recordedBy);
  if (filter?.visibleOnly) q = q.eq("visible_to_member", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ContributionNote[];
}

export async function createContribution(input: {
  member_id: string;
  recorded_by: string;
  kind: string;
  description: string;
  related_event_id: string | null;
  related_task_id: string | null;
  visible_to_member: boolean;
}) {
  const { error } = await db.from("contribution_notes").insert(input);
  if (error) throw error;
}

export async function countContributionsThisWeek(memberId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { count, error } = await db
    .from("contribution_notes")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("visible_to_member", true)
    .gte("created_at", since.toISOString());
  if (error) return 0;
  return count ?? 0;
}

/* ---------- Utilitas tampilan ---------- */

export function rateColor(value: number) {
  if (value >= 70) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-400";
  return "bg-red-500";
}

export function rateLabel(value: number) {
  if (value >= 70) return "Terjaga";
  if (value >= 40) return "Cukup";
  return "Perlu perhatian";
}
