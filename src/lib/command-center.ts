import { supabase } from "@/lib/supabase-external";

/**
 * Beberapa tabel modul strategi/keuangan belum tercakup di tipe Supabase hasil
 * generate, jadi akses dilakukan melalui klien tanpa tipe dan hasilnya dipetakan
 * ke tipe lokal di bawah.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export const OKR_PERIODS = [
  "Kepengurusan_2026",
  "Semester_1_2026",
  "Semester_2_2026",
  "Kuartal_1_2026",
  "Kuartal_2_2026",
  "Kuartal_3_2026",
  "Kuartal_4_2026",
] as const;

export type OkrPeriod = (typeof OKR_PERIODS)[number];

export function periodLabel(period: string): string {
  return period.replace(/_/g, " ");
}

export type Objective = {
  id: string;
  title: string;
  period: string;
  status: string;
  progress_percent: number | null;
  updated_at: string | null;
};

export type KeyResult = {
  id: string;
  title: string;
  objective_id: string | null;
  owner_division: string | null;
  progress_percent: number | null;
  status: string;
  due_date: string | null;
  updated_at: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  division: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

export type DealRow = {
  id: string;
  name: string;
  stage: string;
  value_idr: number | null;
  owner_division: string | null;
  updated_at: string | null;
  companies: { name: string } | null;
};

const ACTIVE_DEAL_STAGES = ["Prospect", "Contacted", "Pitched", "Negotiating"];
export const DEAL_STAGES = [
  "Prospect",
  "Contacted",
  "Pitched",
  "Negotiating",
  "Deal",
  "Rejected",
  "Ghosted",
] as const;
export const ACTIVE_TASK_STATUSES = ["Todo", "In_Progress", "Blocked"];

export async function fetchOkr(period: string) {
  const { data: objectives, error } = await db
    .from("objectives")
    .select("id,title,period,status,progress_percent,updated_at")
    .eq("period", period);
  if (error) throw error;
  const objs = (objectives ?? []) as Objective[];

  let krs: KeyResult[] = [];
  if (objs.length > 0) {
    const { data, error: krError } = await db
      .from("key_results")
      .select("id,title,objective_id,owner_division,progress_percent,status,due_date,updated_at")
      .in(
        "objective_id",
        objs.map((o) => o.id),
      );
    if (krError) throw krError;
    krs = (data ?? []) as KeyResult[];
  }
  return { objectives: objs, keyResults: krs };
}

export async function fetchFinance() {
  const [tx, deals] = await Promise.all([
    db.from("fund_transactions").select("type,amount_idr"),
    db.from("deals").select("id,name,stage,value_idr,owner_division,updated_at,companies(name)"),
  ]);
  if (tx.error) throw tx.error;
  if (deals.error) throw deals.error;

  const transactions = (tx.data ?? []) as { type: string; amount_idr: number | null }[];
  const income = transactions
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + Number(t.amount_idr ?? 0), 0);
  const expense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + Number(t.amount_idr ?? 0), 0);

  const dealRows = (deals.data ?? []) as DealRow[];
  const pipelineValue = dealRows
    .filter((d) => ACTIVE_DEAL_STAGES.includes(d.stage))
    .reduce((s, d) => s + Number(d.value_idr ?? 0), 0);
  const closed = dealRows.filter((d) => d.stage === "Deal");

  const stageCounts = DEAL_STAGES.map((stage) => ({
    stage,
    count: dealRows.filter((d) => d.stage === stage).length,
  }));

  return {
    income,
    expense,
    balance: income - expense,
    pipelineValue,
    deals: dealRows,
    activeDeals: dealRows.filter((d) => ACTIVE_DEAL_STAGES.includes(d.stage)),
    closedCount: closed.length,
    closedValue: closed.reduce((s, d) => s + Number(d.value_idr ?? 0), 0),
    stageCounts,
  };
}

export async function fetchTasks() {
  const { data, error } = await db
    .from("tasks")
    .select("id,title,division,status,priority,due_date,completed_at,updated_at");
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export type RedFlag = {
  id: string;
  category: string;
  title: string;
  description: string;
  urgency: number;
  division?: string | null;
  link?: { to: string };
};

export async function fetchRedFlags(period: string) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const in14 = new Date(today.getTime() + 14 * 86_400_000);
  const in30 = new Date(today.getTime() + 30 * 86_400_000);
  const ago14 = new Date(today.getTime() - 14 * 86_400_000);
  const ago7 = new Date(today.getTime() - 7 * 86_400_000);

  const [okr, tasks, deals, budgets, mous, fundRequests, reimbursements, events] = await Promise.all([
    fetchOkr(period),
    fetchTasks(),
    db
      .from("deals")
      .select("id,name,stage,updated_at,owner_division,companies(name)")
      .in("stage", ["Contacted", "Pitched", "Negotiating"])
      .lt("updated_at", ago14.toISOString()),
    db
      .from("budgets")
      .select("id,category,division,allocated_idr,spent_idr,status")
      .in("status", ["Warning", "Over_Budget"]),
    db
      .from("mous")
      .select("id,title,expiry_date,status,companies(name)")
      .eq("status", "Signed")
      .not("expiry_date", "is", null)
      .lte("expiry_date", iso(in30))
      .gte("expiry_date", iso(today)),
    db
      .from("fund_requests")
      .select("id,purpose,amount_idr,status,created_at,requester_division")
      .in("status", ["Submitted", "Under_Review"])
      .lt("created_at", ago7.toISOString()),
    db
      .from("reimbursement_aging")
      .select("id,purpose,amount_idr,status,days_outstanding,requester_name,requester_division")
      .gt("days_outstanding", 7),
    db
      .from("events")
      .select("id,name,date_start,status")
      .eq("status", "Planning")
      .not("date_start", "is", null)
      .lte("date_start", iso(in14))
      .gte("date_start", iso(today)),
  ]);

  const flags: RedFlag[] = [];

  for (const kr of okr.keyResults.filter((k) => k.status === "Off_Track")) {
    flags.push({
      id: `kr-${kr.id}`,
      category: "Key Result",
      title: kr.title,
      description: `Off Track · progress ${kr.progress_percent ?? 0}%${
        kr.due_date ? ` · tenggat ${kr.due_date}` : ""
      }`,
      urgency: 90,
      division: kr.owner_division,
      link: { to: "/dashboard" },
    });
  }

  const overdue = tasks.filter(
    (t) =>
      !["Done", "Cancelled"].includes(t.status) &&
      t.due_date &&
      new Date(t.due_date) < new Date(iso(today)),
  );
  const byDivision = new Map<string, TaskRow[]>();
  for (const t of overdue) {
    const key = t.division ?? "Tanpa Divisi";
    byDivision.set(key, [...(byDivision.get(key) ?? []), t]);
  }
  for (const [division, rows] of byDivision) {
    const oldest = rows.reduce(
      (min, r) => Math.min(min, new Date(r.due_date!).getTime()),
      Infinity,
    );
    const lateDays = Math.max(0, Math.round((today.getTime() - oldest) / 86_400_000));
    flags.push({
      id: `task-${division}`,
      category: "Task",
      title: `${rows.length} task terlambat di ${division}`,
      description: `Contoh: ${rows
        .slice(0, 3)
        .map((r) => r.title)
        .join(", ")} · terlama ${lateDays} hari`,
      urgency: 80 + Math.min(lateDays, 30),
      division,
      link: { to: "/dashboard" },
    });
  }

  for (const d of (deals.data ?? []) as any[]) {
    const stuckDays = Math.round(
      (today.getTime() - new Date(d.updated_at).getTime()) / 86_400_000,
    );
    flags.push({
      id: `deal-${d.id}`,
      category: "Deal",
      title: d.name,
      description: `${d.companies?.name ?? "Tanpa perusahaan"} · stage ${d.stage} · tidak bergerak ${stuckDays} hari`,
      urgency: 60 + Math.min(stuckDays, 30),
      division: d.owner_division,
      link: { to: "/dashboard" },
    });
  }

  for (const b of (budgets.data ?? []) as any[]) {
    flags.push({
      id: `budget-${b.id}`,
      category: "Anggaran",
      title: `${b.category}${b.division ? ` (${b.division})` : ""}`,
      description: `${b.status === "Over_Budget" ? "Melebihi anggaran" : "Mendekati batas"} · alokasi Rp ${Number(b.allocated_idr ?? 0).toLocaleString("id-ID")} vs terpakai Rp ${Number(b.spent_idr ?? 0).toLocaleString("id-ID")}`,
      urgency: b.status === "Over_Budget" ? 95 : 70,
      division: b.division,
      link: { to: "/budgets" },
    });
  }

  for (const m of (mous.data ?? []) as any[]) {
    const left = Math.round((new Date(m.expiry_date).getTime() - today.getTime()) / 86_400_000);
    flags.push({
      id: `mou-${m.id}`,
      category: "MoU",
      title: m.title,
      description: `${m.companies?.name ?? "Tanpa perusahaan"} · berakhir dalam ${left} hari`,
      urgency: 85 - left,
      link: { to: "/dashboard" },
    });
  }

  for (const f of (fundRequests.data ?? []) as any[]) {
    const waiting = Math.round((today.getTime() - new Date(f.created_at).getTime()) / 86_400_000);
    flags.push({
      id: `fund-${f.id}`,
      category: "Pengajuan Dana",
      title: f.purpose,
      description: `Status ${f.status} · menunggu ${waiting} hari`,
      urgency: 55 + Math.min(waiting, 30),
      division: f.requester_division,
      link: { to: "/fund-approvals" },
    });
  }

  for (const r of (reimbursements.data ?? []) as any[]) {
    if (r.status === "Disbursed" || r.status === "Rejected") continue;
    flags.push({
      id: `reimburse-${r.id}`,
      category: "Reimbursement",
      title: r.purpose ?? "Reimbursement",
      description: `${r.requester_name ?? "Anggota"} menalangi ${Number(
        r.amount_idr ?? 0,
      ).toLocaleString("id-ID")} · belum diganti ${r.days_outstanding ?? 0} hari (status ${r.status})`,
      urgency: 65 + Math.min(Number(r.days_outstanding ?? 0), 35),
      division: r.requester_division,
      link: { to: "/fund-approvals" },
    });
  }

  for (const e of (events.data ?? []) as any[]) {
    const left = Math.round(
      (new Date(e.date_start).getTime() - new Date(iso(today)).getTime()) / 86_400_000,
    );
    flags.push({
      id: `event-${e.id}`,
      category: "Event",
      title: e.name,
      description: `Masih tahap Planning · ${left} hari lagi (${e.date_start})`,
      urgency: 100 - left,
      link: { to: "/dashboard" },
    });
  }

  return flags.sort((a, b) => b.urgency - a.urgency);
}

export type ActivityItem = {
  id: string;
  kind: string;
  description: string;
  at: string;
  division?: string | null;
};

export async function fetchActivity() {
  const [krs, deals, tx, tasks, events, letters] = await Promise.all([
    db
      .from("key_results")
      .select("id,title,progress_percent,owner_division,updated_at")
      .order("updated_at", { ascending: false })
      .limit(10),
    db
      .from("deals")
      .select("id,name,stage,owner_division,updated_at,companies(name)")
      .order("updated_at", { ascending: false })
      .limit(10),
    db
      .from("fund_transactions")
      .select("id,type,amount_idr,description,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("tasks")
      .select("id,title,division,completed_at")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10),
    db
      .from("events")
      .select("id,name,status,updated_at")
      .order("updated_at", { ascending: false })
      .limit(10),
    db
      .from("letters")
      .select("id,letter_number,purpose,requester_division,approved_at")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(10),
  ]);

  const items: ActivityItem[] = [];
  for (const k of (krs.data ?? []) as any[]) {
    items.push({
      id: `kr-${k.id}`,
      kind: "kr",
      description: `Key Result "${k.title}" → ${k.progress_percent ?? 0}%`,
      at: k.updated_at,
      division: k.owner_division,
    });
  }
  for (const d of (deals.data ?? []) as any[]) {
    items.push({
      id: `deal-${d.id}`,
      kind: "deal",
      description: `Deal "${d.name}"${d.companies?.name ? ` (${d.companies.name})` : ""} di stage ${d.stage}`,
      at: d.updated_at,
      division: d.owner_division,
    });
  }
  for (const t of (tx.data ?? []) as any[]) {
    items.push({
      id: `tx-${t.id}`,
      kind: "finance",
      description: `${t.type === "Income" ? "Dana masuk" : "Pengeluaran"}: ${t.description}`,
      at: t.created_at,
    });
  }
  for (const t of (tasks.data ?? []) as any[]) {
    items.push({
      id: `task-${t.id}`,
      kind: "task",
      description: `Task selesai: "${t.title}"`,
      at: t.completed_at,
      division: t.division,
    });
  }
  for (const e of (events.data ?? []) as any[]) {
    items.push({
      id: `event-${e.id}`,
      kind: "event",
      description: `Event "${e.name}" berstatus ${e.status}`,
      at: e.updated_at,
    });
  }
  for (const l of (letters.data ?? []) as any[]) {
    items.push({
      id: `letter-${l.id}`,
      kind: "letter",
      description: `Surat ${l.letter_number ?? ""} disetujui: ${l.purpose}`.trim(),
      at: l.approved_at,
      division: l.requester_division,
    });
  }

  return items
    .filter((i) => !!i.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}

export type AlignmentStatus =
  | "Selaras"
  | "Perlu Perhatian"
  | "Misalignment"
  | "Stagnan"
  | "Belum Mulai";

export function alignmentStatus(
  krCount: number,
  taskCount: number,
  krProgress: number,
  doneRate: number,
): AlignmentStatus {
  if (krCount === 0 || taskCount === 0) return "Belum Mulai";
  if (doneRate >= 70 && krProgress < 40) return "Misalignment";
  if (krProgress >= 70 && doneRate >= 70) return "Selaras";
  if (krProgress < 40 && doneRate < 40) return "Stagnan";
  return "Perlu Perhatian";
}

export const ALIGNMENT_META: Record<
  AlignmentStatus,
  { dot: string; className: string; explanation: string }
> = {
  Selaras: {
    dot: "🟢",
    className: "bg-emerald-100 text-emerald-800",
    explanation: "Progress Key Result ≥70% dan task done rate ≥70%. Aktivitas berdampak.",
  },
  "Perlu Perhatian": {
    dot: "🟡",
    className: "bg-amber-100 text-amber-800",
    explanation: "Progress KR atau task done rate berada di kisaran 40–69%. Perlu dorongan.",
  },
  Misalignment: {
    dot: "🔴",
    className: "bg-red-100 text-red-800",
    explanation:
      "Divisi menyelesaikan banyak task tapi Key Result tidak bergerak. Kemungkinan task yang dikerjakan tidak nyambung ke target, atau target perlu direvisi.",
  },
  Stagnan: {
    dot: "⚫",
    className: "bg-neutral-200 text-neutral-800",
    explanation: "Progress KR <40% dan task done rate <40%. Hampir tidak ada pergerakan.",
  },
  "Belum Mulai": {
    dot: "⚪",
    className: "bg-muted text-muted-foreground",
    explanation: "Belum ada Key Result atau task tercatat untuk divisi ini.",
  },
};

/* ---------------------------------------------------------------------------
 * Snapshot OKR (tabel okr_snapshots + rpc take_okr_snapshot)
 * ------------------------------------------------------------------------- */

export type OkrSnapshot = {
  id: string;
  snapshot_date: string;
  period: string;
  objectives_avg_progress: number | null;
  objectives_total: number | null;
  objectives_on_track: number | null;
  objectives_at_risk: number | null;
  objectives_off_track: number | null;
  objectives_achieved: number | null;
};

export async function fetchOkrSnapshots(period: string, limit = 12): Promise<OkrSnapshot[]> {
  const { data, error } = await db
    .from("okr_snapshots")
    .select(
      "id,snapshot_date,period,objectives_avg_progress,objectives_total,objectives_on_track,objectives_at_risk,objectives_off_track,objectives_achieved",
    )
    .eq("period", period)
    .order("snapshot_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as OkrSnapshot[]).slice().reverse();
}

export async function takeOkrSnapshot(period: string): Promise<void> {
  const { error } = await (supabase as any).rpc("take_okr_snapshot", { p_period: period });
  if (error) throw error;
}

/* ---------------------------------------------------------------------------
 * Uang anggota yang masih nyangkut (reimbursement belum diganti)
 * ------------------------------------------------------------------------- */

export type StuckMoney = {
  total: number;
  peopleCount: number;
  oldestDays: number;
  rows: {
    id: string | null;
    purpose: string | null;
    requester_name: string | null;
    amount_idr: number | null;
    days_outstanding: number | null;
    status: string | null;
  }[];
};

export async function fetchStuckMoney(): Promise<StuckMoney> {
  const { data, error } = await db
    .from("reimbursement_aging")
    .select("id,purpose,requester_id,requester_name,amount_idr,days_outstanding,status")
    .order("days_outstanding", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as any[];
  const pending = rows.filter((r) => r.status !== "Disbursed" && r.status !== "Rejected");
  return {
    total: pending.reduce((s, r) => s + Number(r.amount_idr ?? 0), 0),
    peopleCount: new Set(pending.map((r) => r.requester_id)).size,
    oldestDays: pending.reduce((m, r) => Math.max(m, Number(r.days_outstanding ?? 0)), 0),
    rows: pending.slice(0, 5),
  };
}

/* ---------------------------------------------------------------------------
 * Rata-rata kehadiran rapat per divisi
 * ------------------------------------------------------------------------- */

export async function fetchAttendanceByDivision(): Promise<Record<string, number>> {
  const [attendance, profiles] = await Promise.all([
    db.from("meeting_attendance").select("member_id,status"),
    db.from("profiles").select("id,division"),
  ]);
  if (attendance.error) throw attendance.error;
  if (profiles.error) throw profiles.error;

  const divisionOf = new Map<string, string | null>(
    ((profiles.data ?? []) as any[]).map((p) => [p.id as string, p.division as string | null]),
  );
  const tally = new Map<string, { present: number; total: number }>();
  for (const row of (attendance.data ?? []) as any[]) {
    const division = divisionOf.get(row.member_id) ?? null;
    if (!division) continue;
    const cur = tally.get(division) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (row.status === "Hadir" || row.status === "Terlambat") cur.present += 1;
    tally.set(division, cur);
  }
  const result: Record<string, number> = {};
  for (const [division, v] of tally) {
    result[division] = v.total === 0 ? 0 : Math.round((v.present / v.total) * 100);
  }
  return result;
}
