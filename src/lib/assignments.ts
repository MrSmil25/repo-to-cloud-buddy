import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentSubmission =
  Database["public"]["Tables"]["assignment_submissions"]["Row"];
export type AssignmentScope = Database["public"]["Enums"]["assignment_scope"];
export type SubmissionVisibility = Database["public"]["Enums"]["submission_visibility"];

export const ASSIGNMENT_CATEGORIES = ["Refleksi", "Rangkuman", "Laporan", "Lainnya"] as const;

export type AssignmentProgressRow = {
  assignment_id: string | null;
  title: string | null;
  scope: AssignmentScope | null;
  target_division: string | null;
  due_date: string | null;
  total_target: number | null;
  total_submitted: number | null;
};

export function visibilityHint(visibility: SubmissionVisibility | string | null): string {
  return visibility === "Supervisor_Ketua_Kadiv"
    ? "Pembina, Ketua, dan Kadiv kamu dapat melihat kumpulan ini."
    : "Hanya Pembina yang dapat melihat kumpulan ini.";
}

export function scopeLabel(
  scope: AssignmentScope | string | null,
  divisionName?: string | null,
): string {
  if (scope === "Semua") return "Semua Anggota";
  if (scope === "Divisi") return `Divisi ${divisionName ?? "-"}`;
  return "Individu";
}

/** Penugasan yang ditujukan ke user saat ini (RLS + is_my_assignment yang memfilter). */
export async function fetchMyAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("is_active", true)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMySubmissions(memberId: string): Promise<AssignmentSubmission[]> {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("member_id", memberId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertSubmission(input: {
  assignmentId: string;
  memberId: string;
  content: string | null;
  fileUrl: string | null;
}): Promise<void> {
  const { error } = await supabase.from("assignment_submissions").upsert(
    {
      assignment_id: input.assignmentId,
      member_id: input.memberId,
      content: input.content,
      file_url: input.fileUrl,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,member_id" },
  );
  if (error) throw error;
}

export async function uploadSubmissionFile(file: File, memberId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `assignments/${memberId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function signedFileUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/* ---------------- Supervisor ---------------- */

export async function fetchAssignmentsByCreator(creatorId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("created_by", creatorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAssignmentProgress(): Promise<AssignmentProgressRow[]> {
  const { data, error } = await supabase.from("assignment_progress").select("*");
  if (error) throw error;
  return (data ?? []) as AssignmentProgressRow[];
}

export async function fetchAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAssignmentTargets(assignmentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("assignment_targets")
    .select("member_id")
    .eq("assignment_id", assignmentId);
  if (error) throw error;
  return (data ?? []).map((r) => r.member_id).filter((v): v is string => !!v);
}

export async function fetchSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type CreateAssignmentInput = {
  title: string;
  instructions: string | null;
  category: string | null;
  scope: AssignmentScope;
  target_division: string | null;
  visibility: SubmissionVisibility;
  allow_text: boolean;
  allow_file: boolean;
  due_date: string | null;
  memberIds: string[];
};

export async function createAssignment(
  input: CreateAssignmentInput,
  createdBy: string,
): Promise<string> {
  const { memberIds, ...rest } = input;
  const { data, error } = await supabase
    .from("assignments")
    .insert({ ...rest, created_by: createdBy, is_active: true })
    .select("id")
    .single();
  if (error) throw error;
  const assignmentId = data.id;
  if (rest.scope === "Individu" && memberIds.length > 0) {
    const { error: tErr } = await supabase
      .from("assignment_targets")
      .insert(memberIds.map((m) => ({ assignment_id: assignmentId, member_id: m })));
    if (tErr) throw tErr;
  }
  return assignmentId;
}

export async function setAssignmentActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from("assignments")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function commentSubmission(
  submissionId: string,
  comment: string,
  supervisorId: string,
): Promise<void> {
  const { error } = await supabase
    .from("assignment_submissions")
    .update({
      supervisor_comment: comment,
      commented_by: supervisorId,
      commented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw error;
}
