import { supabase } from "@/lib/supabase-external";

export type CalendarItemType = "event" | "task" | "kr" | "mou" | "meeting";

export type CalendarItem = {
  id: string;
  type: CalendarItemType;
  title: string;
  /** ISO date (yyyy-MM-dd) */
  date: string;
  endDate?: string;
  time?: string | null;
  color: string;
  dotColor: string;
  link?: { to: string; params?: Record<string, string> };
  division?: string | null;
  ownerId?: string | null;
  done?: boolean;
};

export const TYPE_LABEL: Record<CalendarItemType, string> = {
  event: "Event",
  task: "Task",
  kr: "Key Result",
  mou: "MoU",
  meeting: "Rapat",
};

export const TYPE_DOT: Record<CalendarItemType, string> = {
  event: "bg-purple-500",
  task: "bg-blue-500",
  kr: "bg-yellow-600",
  mou: "bg-red-800",
  meeting: "bg-green-600",
};

const TASK_PRIORITY_COLOR: Record<string, { pill: string; dot: string }> = {
  Critical: { pill: "bg-red-100 text-red-700", dot: "bg-red-500" },
  High: { pill: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  Medium: { pill: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  Low: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchCalendarItems(
  from: Date,
  to: Date,
  myId?: string | null,
): Promise<CalendarItem[]> {
  const fromISO = toISODate(from);
  const toISO = toISODate(to);

  const [events, tasks, krs, mous, meetings, myAttendance] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, date_start, date_end, pic_id, status")
      .not("date_start", "is", null)
      .lte("date_start", toISO)
      .gte("date_end", fromISO),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, status, division, assignee_id")
      .not("due_date", "is", null)
      .gte("due_date", fromISO)
      .lte("due_date", toISO),
    supabase
      .from("key_results")
      .select("id, title, due_date, owner_division, owner_person_id, status")
      .not("due_date", "is", null)
      .gte("due_date", fromISO)
      .lte("due_date", toISO),
    supabase
      .from("mous")
      .select("id, title, expiry_date, status")
      .not("expiry_date", "is", null)
      .gte("expiry_date", fromISO)
      .lte("expiry_date", toISO),
    supabase
      .from("meetings")
      .select("id, title, meeting_date, division, led_by, recorded_by")
      .gte("meeting_date", `${fromISO}T00:00:00`)
      .lte("meeting_date", `${toISO}T23:59:59`),
    myId
      ? supabase.from("meeting_attendance").select("meeting_id").eq("member_id", myId)
      : Promise.resolve({ data: [] as { meeting_id: string | null }[], error: null }),
  ]);

  const attended = new Set(
    (myAttendance.data ?? []).map((a) => a.meeting_id).filter(Boolean) as string[],
  );

  const items: CalendarItem[] = [];

  for (const e of events.data ?? []) {
    if (!e.date_start) continue;
    items.push({
      id: `event-${e.id}`,
      type: "event",
      title: e.name,
      date: e.date_start,
      ...(e.date_end ? { endDate: e.date_end } : {}),
      color: "bg-purple-100 text-purple-700",
      dotColor: "bg-purple-500",
      ownerId: e.pic_id,
      done: e.status === "Done" || e.status === "Cancelled",
    });
  }

  for (const t of tasks.data ?? []) {
    if (!t.due_date) continue;
    const c = TASK_PRIORITY_COLOR[t.priority] ?? TASK_PRIORITY_COLOR["Medium"]!;
    items.push({
      id: `task-${t.id}`,
      type: "task",
      title: t.title,
      date: t.due_date,
      color: c.pill,
      dotColor: c.dot,
      link: { to: "/workspace" },
      division: t.division,
      ownerId: t.assignee_id,
      done: t.status === "Done" || t.status === "Cancelled",
    });
  }

  for (const k of krs.data ?? []) {
    if (!k.due_date) continue;
    items.push({
      id: `kr-${k.id}`,
      type: "kr",
      title: `KR: ${k.title}`,
      date: k.due_date,
      color: "bg-yellow-100 text-yellow-800",
      dotColor: "bg-yellow-600",
      division: k.owner_division,
      ownerId: k.owner_person_id,
      done: k.status === "Achieved" || k.status === "Cancelled",
    });
  }

  for (const m of mous.data ?? []) {
    if (!m.expiry_date) continue;
    items.push({
      id: `mou-${m.id}`,
      type: "mou",
      title: `MoU berakhir: ${m.title}`,
      date: m.expiry_date,
      color: "bg-red-100 text-red-800",
      dotColor: "bg-red-800",
      done: m.status === "Terminated" || m.status === "Expired",
    });
  }

  for (const m of meetings.data ?? []) {
    if (!m.meeting_date) continue;
    const d = new Date(m.meeting_date);
    items.push({
      id: `meeting-${m.id}`,
      type: "meeting",
      title: m.title,
      date: toISODate(d),
      time: new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d),
      color: "bg-green-100 text-green-700",
      dotColor: "bg-green-600",
      link: { to: "/meetings/$id", params: { id: m.id } },
      division: m.division,
      ownerId:
        myId && (m.led_by === myId || m.recorded_by === myId || attended.has(m.id))
          ? myId
          : m.led_by,
    });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function itemDates(item: CalendarItem): string[] {
  if (!item.endDate || item.endDate === item.date) return [item.date];
  const out: string[] = [];
  const start = new Date(`${item.date}T00:00:00`);
  const end = new Date(`${item.endDate}T00:00:00`);
  for (let d = start; d <= end && out.length < 60; d = new Date(d.getTime() + 86_400_000)) {
    out.push(toISODate(d));
  }
  return out;
}

export function relativeDayLabel(dateISO: string, today = new Date()): string {
  const target = new Date(`${dateISO}T00:00:00`);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((target.getTime() - base.getTime()) / 86_400_000);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "besok";
  if (diff === -1) return "kemarin";
  if (diff > 1) return `dalam ${diff} hari`;
  return `terlambat ${Math.abs(diff)} hari`;
}
