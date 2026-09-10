import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingDecision = Database["public"]["Tables"]["meeting_decisions"]["Row"];
export type MeetingAttendance = Database["public"]["Tables"]["meeting_attendance"]["Row"];
export type MeetingType = Database["public"]["Enums"]["meeting_type"];

export const MEETING_TYPES: MeetingType[] = [
  "Rapat_Besar",
  "Rapat_Divisi",
  "Rapat_Event",
  "Rapat_BPH",
  "Lainnya",
];

export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  Rapat_Besar: "Rapat Besar",
  Rapat_Divisi: "Rapat Divisi",
  Rapat_Event: "Rapat Event",
  Rapat_BPH: "Rapat BPH",
  Lainnya: "Lainnya",
};

export const MEETING_TYPE_CLASS: Record<MeetingType, string> = {
  Rapat_Besar: "bg-blue-100 text-blue-700",
  Rapat_Divisi: "bg-green-100 text-green-700",
  Rapat_Event: "bg-purple-100 text-purple-700",
  Rapat_BPH: "bg-red-100 text-red-700",
  Lainnya: "bg-muted text-muted-foreground",
};

export const ATTENDANCE_STATUSES = ["Hadir", "Izin", "Sakit", "Alpa", "Terlambat"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_CLASS: Record<string, string> = {
  Hadir: "bg-green-100 text-green-700",
  Izin: "bg-amber-100 text-amber-700",
  Sakit: "bg-sky-100 text-sky-700",
  Alpa: "bg-red-100 text-red-700",
  Terlambat: "bg-orange-100 text-orange-700",
};

export function canManageMeetings(role?: string | null) {
  return !!role && ["Ketua", "Waketu", "Sekretaris", "Kadiv", "Supervisor"].includes(role);
}

export function canRecapAttendance(role?: string | null) {
  return !!role && ["Ketua", "Waketu", "Sekretaris", "Kadiv", "Supervisor"].includes(role);
}

/** Boleh mengelola isi rapat tertentu (notulensi, keputusan, presensi). */
export function canEditMeeting(
  meeting: Pick<Meeting, "recorded_by" | "led_by"> | null | undefined,
  userId?: string | null,
  role?: string | null,
) {
  if (!meeting) return false;
  if (userId && (meeting.recorded_by === userId || meeting.led_by === userId)) return true;
  return !!role && ["Ketua", "Waketu", "Sekretaris", "Supervisor"].includes(role);
}

export function formatMeetingDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const d = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const t = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${d} ${t}`;
}

export type MeetingListItem = Meeting & {
  decisions_count: number;
  attendance_total: number;
  attendance_present: number;
};

export async function fetchMeetings(): Promise<MeetingListItem[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("*, meeting_decisions(id), meeting_attendance(id, status)")
    .order("meeting_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { meeting_decisions, meeting_attendance, ...meeting } = row as Meeting & {
      meeting_decisions: { id: string }[] | null;
      meeting_attendance: { id: string; status: string }[] | null;
    };
    const att = meeting_attendance ?? [];
    return {
      ...(meeting as Meeting),
      decisions_count: (meeting_decisions ?? []).length,
      attendance_total: att.length,
      attendance_present: att.filter((a: any) => a.status === "Hadir" || a.status === "Terlambat").length,
    };
  });
}

export async function fetchMeeting(id: string): Promise<Meeting | null> {
  const { data, error } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchDecisions(meetingId: string): Promise<MeetingDecision[]> {
  const { data, error } = await supabase
    .from("meeting_decisions")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAttendance(meetingId: string): Promise<MeetingAttendance[]> {
  const { data, error } = await supabase
    .from("meeting_attendance")
    .select("*")
    .eq("meeting_id", meetingId);
  if (error) throw error;
  return data ?? [];
}

export type NewMeeting = {
  title: string;
  meeting_type: MeetingType;
  meeting_date: string;
  location: string | null;
  division: string | null;
  related_event_id: string | null;
  agenda: string | null;
  led_by: string | null;
};

export async function createMeeting(input: NewMeeting): Promise<Meeting> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...input, recorded_by: userData.user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeeting(id: string, patch: Partial<NewMeeting> & { notes?: string }) {
  const { error } = await supabase.from("meetings").update(patch).eq("id", id);
  if (error) throw error;
}

export type NewDecision = {
  meeting_id: string;
  decision: string;
  pic_id: string | null;
  due_date: string | null;
};

export async function createDecision(input: NewDecision): Promise<MeetingDecision> {
  const { data, error } = await supabase
    .from("meeting_decisions")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createTaskFromDecision(decisionId: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_task_from_decision", {
    p_decision_id: decisionId,
  });
  if (error) throw error;
  return data as string;
}

export async function saveAttendance(
  meetingId: string,
  rows: { member_id: string; status: string; note: string | null }[],
) {
  const payload = rows.map((r) => ({ ...r, meeting_id: meetingId }));
  const { error } = await supabase
    .from("meeting_attendance")
    .upsert(payload, { onConflict: "meeting_id,member_id" });
  if (error) throw error;
}

export type AttendanceRecap = {
  member_id: string;
  invited: number;
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpa: number;
  Terlambat: number;
  percent: number;
};

export async function fetchAttendanceRecap(): Promise<AttendanceRecap[]> {
  const { data, error } = await supabase
    .from("meeting_attendance")
    .select("member_id, status")
    .limit(5000);
  if (error) throw error;
  const map = new Map<string, AttendanceRecap>();
  for (const row of data ?? []) {
    if (!row.member_id) continue;
    let rec = map.get(row.member_id);
    if (!rec) {
      rec = {
        member_id: row.member_id,
        invited: 0,
        Hadir: 0,
        Izin: 0,
        Sakit: 0,
        Alpa: 0,
        Terlambat: 0,
        percent: 0,
      };
      map.set(row.member_id, rec);
    }
    rec.invited += 1;
    const key = row.status as AttendanceStatus;
    if (ATTENDANCE_STATUSES.includes(key)) {
      rec[key] += 1;
    }

  }
  const list = [...map.values()];
  for (const rec of list) {
    rec.percent = rec.invited ? Math.round(((rec.Hadir + rec.Terlambat) / rec.invited) * 100) : 0;
  }
  return list.sort((a, b) => b.percent - a.percent);
}
