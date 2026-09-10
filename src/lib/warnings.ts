import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as {
  from: (table: string) => any;
};

/* ---------- Tingkatan & status ---------- */

export const WARNING_LEVELS = [
  "Teguran_Lisan",
  "SP1",
  "SP2",
  "SP3",
  "Pemberhentian",
] as const;

export type WarningLevel = (typeof WARNING_LEVELS)[number];

export const WARNING_LEVEL_LABEL: Record<string, string> = {
  Teguran_Lisan: "Teguran Lisan",
  SP1: "SP 1",
  SP2: "SP 2",
  SP3: "SP 3",
  Pemberhentian: "Pemberhentian",
};

/** Garis aksen kiri kartu sesuai tingkatan. */
export const WARNING_LEVEL_ACCENT: Record<string, string> = {
  Teguran_Lisan: "border-l-4 border-l-amber-200",
  SP1: "border-l-4 border-l-amber-400",
  SP2: "border-l-4 border-l-orange-500",
  SP3: "border-l-4 border-l-red-500",
  Pemberhentian: "border-l-8 border-l-red-800 border-red-300",
};

export const WARNING_LEVEL_BADGE: Record<string, string> = {
  Teguran_Lisan: "bg-amber-100 text-amber-800",
  SP1: "bg-amber-200 text-amber-900",
  SP2: "bg-orange-100 text-orange-800",
  SP3: "bg-red-100 text-red-700",
  Pemberhentian: "bg-red-800 text-white",
};

export const WARNING_STATUS_BADGE: Record<string, string> = {
  Berlaku: "bg-emerald-100 text-emerald-700",
  Dicabut: "bg-muted text-muted-foreground",
  Selesai: "bg-sky-100 text-sky-700",
};

/** Urutan jenjang; makin besar makin berat. */
export function levelRank(level?: string | null) {
  const i = WARNING_LEVELS.indexOf(level as WarningLevel);
  return i < 0 ? -1 : i;
}

/* ---------- Tipe ---------- */

export type WarningRow = {
  id: string;
  member_id: string;
  level: string;
  source: string;
  reason: string;
  linked_task_ids: string[] | null;
  linked_meeting_ids: string[] | null;
  linked_coaching_ids: string[] | null;
  linked_proposal_id: string | null;
  issued_by: string;
  issued_at: string | null;
  effective_until: string | null;
  status: string;
  member_acknowledged: boolean | null;
  acknowledged_at: string | null;
  member_response: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
  member: { full_name: string; division: string | null; photo_url: string | null } | null;
  issuer: { full_name: string } | null;
};

const WARNING_FIELDS =
  "id,member_id,level,source,reason,linked_task_ids,linked_meeting_ids,linked_coaching_ids," +
  "linked_proposal_id,issued_by,issued_at,effective_until,status,member_acknowledged," +
  "acknowledged_at,member_response,revoked_by,revoked_at,revoke_reason,created_at," +
  "member:profiles!warnings_member_id_fkey(full_name,division,photo_url)," +
  "issuer:profiles!warnings_issued_by_fkey(full_name)";

/* ---------- Query ---------- */

export async function fetchWarnings(filter?: {
  memberId?: string;
  issuedBy?: string;
  activeOnly?: boolean;
}) {
  let q = db.from("warnings").select(WARNING_FIELDS).order("created_at", { ascending: false });
  if (filter?.memberId) q = q.eq("member_id", filter.memberId);
  if (filter?.issuedBy) q = q.eq("issued_by", filter.issuedBy);
  if (filter?.activeOnly) q = q.eq("status", "Berlaku");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as WarningRow[];
}

export async function countUnacknowledgedWarnings(memberId: string) {
  const { count, error } = await db
    .from("warnings")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "Berlaku")
    .or("member_acknowledged.is.null,member_acknowledged.eq.false");
  if (error) return 0;
  return count ?? 0;
}

/* ---------- Mutasi ---------- */

export type NewWarningInput = {
  member_id: string;
  level: string;
  reason: string;
  linked_task_ids: string[];
  linked_meeting_ids: string[];
  linked_coaching_ids: string[];
  effective_until: string | null;
};

export async function issueWarning(input: NewWarningInput, issuedBy: string) {
  const payload = {
    member_id: input.member_id,
    level: input.level,
    source: "Langsung",
    reason: input.reason,
    linked_task_ids: input.linked_task_ids.length ? input.linked_task_ids : null,
    linked_meeting_ids: input.linked_meeting_ids.length ? input.linked_meeting_ids : null,
    linked_coaching_ids: input.linked_coaching_ids.length ? input.linked_coaching_ids : null,
    effective_until: input.effective_until,
    issued_by: issuedBy,
    status: "Berlaku",
  };
  const { error } = await db.from("warnings").insert(payload);
  if (error) throw error;
}

export async function acknowledgeWarning(id: string) {
  const { error } = await db
    .from("warnings")
    .update({ member_acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function saveMemberResponse(id: string, response: string) {
  const { error } = await db
    .from("warnings")
    .update({ member_response: response })
    .eq("id", id);
  if (error) throw error;
}

export async function revokeWarning(id: string, revokedBy: string, reason: string) {
  const { error } = await db
    .from("warnings")
    .update({
      status: "Dicabut",
      revoked_by: revokedBy,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
    })
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Bukti ---------- */

export type EvidenceItem = { id: string; label: string; sub: string | null };

export async function fetchTaskEvidence(memberId: string): Promise<EvidenceItem[]> {
  const { data, error } = await db
    .from("tasks")
    .select("id,title,status,due_date,created_at")
    .eq("assignee_id", memberId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as any[]).map((t) => ({
    id: t.id,
    label: t.title,
    sub: [t.status, t.due_date ? `tenggat ${t.due_date}` : null].filter(Boolean).join(" · "),
  }));
}

export async function fetchMeetingEvidence(memberId: string): Promise<EvidenceItem[]> {
  const { data, error } = await db
    .from("meeting_attendance")
    .select("status,meeting:meetings(id,title,meeting_date)")
    .eq("member_id", memberId)
    .limit(100);
  if (error) throw error;
  const rows = ((data ?? []) as any[])
    .filter((r) => r.meeting)
    .map((r) => ({
      id: r.meeting.id as string,
      label: r.meeting.title as string,
      sub: [r.status, r.meeting.meeting_date?.slice(0, 10)].filter(Boolean).join(" · "),
      date: r.meeting.meeting_date as string,
    }));
  rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return rows.map(({ id, label, sub }) => ({ id, label, sub }));
}

export async function fetchCoachingEvidence(memberId: string): Promise<EvidenceItem[]> {
  const { data, error } = await db
    .from("coaching_notes")
    .select("id,topic,discussion,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as any[]).map((c) => ({
    id: c.id,
    label: `${c.topic} — ${String(c.discussion).slice(0, 60)}`,
    sub: c.created_at?.slice(0, 10) ?? null,
  }));
}

/** Ambil label untuk bukti yang sudah tertaut pada sebuah SP. */
export async function fetchLinkedEvidence(w: WarningRow) {
  const [tasks, meetings, coachings] = await Promise.all([
    w.linked_task_ids?.length
      ? db.from("tasks").select("id,title").in("id", w.linked_task_ids)
      : Promise.resolve({ data: [] }),
    w.linked_meeting_ids?.length
      ? db.from("meetings").select("id,title,meeting_date").in("id", w.linked_meeting_ids)
      : Promise.resolve({ data: [] }),
    w.linked_coaching_ids?.length
      ? db.from("coaching_notes").select("id,topic,created_at").in("id", w.linked_coaching_ids)
      : Promise.resolve({ data: [] }),
  ]);
  return {
    tasks: ((tasks as any).data ?? []) as { id: string; title: string }[],
    meetings: ((meetings as any).data ?? []) as {
      id: string;
      title: string;
      meeting_date: string | null;
    }[],
    coachings: ((coachings as any).data ?? []) as {
      id: string;
      topic: string;
      created_at: string;
    }[],
  };
}
