import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export const TASK_STATUSES = ["Todo", "In_Progress", "Blocked", "Done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<string, string> = {
  Todo: "Todo",
  In_Progress: "Sedang Dikerjakan",
  Blocked: "Terhambat",
  Done: "Selesai",
  Cancelled: "Dibatalkan",
};

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const TASK_PRIORITY_LABEL: Record<string, string> = {
  Low: "Rendah",
  Medium: "Sedang",
  High: "Tinggi",
  Critical: "Kritis",
};

export const PRIORITY_CLASS: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-sky-100 text-sky-700",
  High: "bg-amber-100 text-amber-700",
  Critical: "bg-red-100 text-red-700",
};

export type MyTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  is_private: boolean;
  key_result_id: string | null;
  related_event_id: string | null;
  related_deal_id: string | null;
  origin_type: string | null;
  origin_note: string | null;
  created_by: string | null;
  division?: string | null;
};

export type MyDeal = {
  id: string;
  name: string;
  stage: string;
  value_idr: number | null;
  deadline: string | null;
  companies: { name: string } | null;
};

export type MyKeyResult = {
  id: string;
  title: string;
  status: string;
  progress_percent: number | null;
  due_date: string | null;
};

export type OptionRow = { id: string; label: string };

const TASK_FIELDS =
  "id,title,description,status,priority,due_date,completed_at,is_private,key_result_id,related_event_id,related_deal_id,origin_type,origin_note,created_by,division";

export function isOverdue(task: { due_date: string | null; status: string }) {
  if (!task.due_date || task.status === "Done" || task.status === "Cancelled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

export async function fetchMyWorkspace(userId: string) {
  const [tasks, deals, krs] = await Promise.all([
    db.from("tasks").select(TASK_FIELDS).eq("assignee_id", userId),
    db
      .from("deals")
      .select("id,name,stage,value_idr,deadline,companies(name)")
      .eq("owner_person_id", userId),
    db
      .from("key_results")
      .select("id,title,status,progress_percent,due_date")
      .eq("owner_person_id", userId),
  ]);
  if (tasks.error) throw tasks.error;
  if (deals.error) throw deals.error;
  if (krs.error) throw krs.error;
  return {
    tasks: (tasks.data ?? []) as MyTask[],
    deals: (deals.data ?? []) as MyDeal[],
    keyResults: (krs.data ?? []) as MyKeyResult[],
  };
}

export async function fetchLinkOptions() {
  const [krs, events, deals] = await Promise.all([
    db.from("key_results").select("id,title").order("title"),
    db.from("events").select("id,name").order("date_start", { ascending: false }),
    db.from("deals").select("id,name").order("name"),
  ]);
  return {
    keyResults: ((krs.data ?? []) as { id: string; title: string }[]).map((r) => ({
      id: r.id,
      label: r.title,
    })),
    events: ((events.data ?? []) as { id: string; name: string }[]).map((r) => ({
      id: r.id,
      label: r.name,
    })),
    deals: ((deals.data ?? []) as { id: string; name: string }[]).map((r) => ({
      id: r.id,
      label: r.name,
    })),
  } satisfies Record<string, OptionRow[]>;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const patch: Record<string, unknown> = {
    status,
    completed_at: status === "Done" ? new Date().toISOString() : null,
  };
  const { error } = await db.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export type NewTaskInput = {
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  is_private: boolean;
  key_result_id: string | null;
  related_event_id: string | null;
  related_deal_id: string | null;
  assignee_id: string;
  division: string | null;
};

export async function createMyTask(input: NewTaskInput) {
  const payload: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    priority: input.priority,
    due_date: input.due_date,
    is_private: input.is_private,
    status: "Todo",
    assignee_id: input.assignee_id,
    created_by: input.assignee_id,
    division: input.division,
    // Task privat dilarang punya keterkaitan apa pun oleh aturan database.
    key_result_id: input.is_private ? null : input.key_result_id,
    related_event_id: input.is_private ? null : input.related_event_id,
    related_deal_id: input.is_private ? null : input.related_deal_id,
  };
  const { error } = await db.from("tasks").insert(payload);
  if (error) throw error;
}

/* ---------- Progres Anggota ---------- */

export type MemberProgress = {
  member_id: string;
  full_name: string;
  nickname: string | null;
  division: string | null;
  role: string;
  photo_url: string | null;
  tasks_active: number | null;
  tasks_done: number | null;
  tasks_overdue: number | null;
  deals_active: number | null;
  deals_closed: number | null;
  deals_value_closed: number | null;
  kr_active: number | null;
  kr_avg_progress: number | null;
};

export async function fetchMemberProgress() {
  const { data, error } = await db.from("member_progress").select("*");
  if (error) throw error;
  return (data ?? []) as MemberProgress[];
}

export async function fetchMemberDetail(memberId: string) {
  const [tasks, deals, krs] = await Promise.all([
    db
      .from("tasks")
      .select("id,title,status,priority,due_date,origin_type,origin_note,created_by,related_event_id")
      .eq("assignee_id", memberId)
      .eq("is_private", false)
      .in("status", ["Todo", "In_Progress", "Blocked"]),
    db
      .from("deals")
      .select("id,name,stage,value_idr,deadline,companies(name)")
      .eq("owner_person_id", memberId),
    db
      .from("key_results")
      .select("id,title,status,progress_percent,due_date")
      .eq("owner_person_id", memberId),
  ]);
  return {
    tasks: (tasks.data ?? []) as {
      id: string;
      title: string;
      status: string;
      priority: string;
      due_date: string | null;
      origin_type: string | null;
      origin_note: string | null;
      created_by: string | null;
      related_event_id: string | null;
    }[],
    deals: (deals.data ?? []) as MyDeal[],
    keyResults: (krs.data ?? []) as MyKeyResult[],
  };
}

export type HealthKey = "produktif" | "perhatian" | "tertinggal" | "kosong";

export const HEALTH_META: Record<HealthKey, { label: string; className: string }> = {
  produktif: { label: "🟢 Produktif", className: "bg-emerald-100 text-emerald-700" },
  perhatian: { label: "🟡 Perlu Perhatian", className: "bg-amber-100 text-amber-700" },
  tertinggal: { label: "🔴 Tertinggal", className: "bg-red-100 text-red-700" },
  kosong: { label: "⚪ Belum Ada Beban", className: "bg-muted text-muted-foreground" },
};

export function memberHealth(m: MemberProgress): HealthKey {
  const n = (v: number | null) => Number(v ?? 0);
  const total =
    n(m.tasks_active) +
    n(m.tasks_done) +
    n(m.tasks_overdue) +
    n(m.deals_active) +
    n(m.deals_closed) +
    n(m.kr_active);
  if (total === 0) return "kosong";
  const overdue = n(m.tasks_overdue);
  // Progress KR hanya dinilai bila anggota memang menanggung KR.
  const krAvg = n(m.kr_active) > 0 ? n(m.kr_avg_progress) : null;
  if (overdue >= 3 || (krAvg !== null && krAvg < 30)) return "tertinggal";
  if (overdue >= 1 || (krAvg !== null && krAvg < 60)) return "perhatian";
  return "produktif";
}

export function progressBarColor(value: number): string {
  if (value >= 100) return "bg-emerald-600";
  if (value >= 70) return "bg-emerald-400";
  if (value >= 40) return "bg-amber-400";
  return "bg-red-500";
}
