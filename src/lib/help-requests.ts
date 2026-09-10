import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export type HelpRequest = {
  id: string;
  requested_by: string;
  requester_division: string | null;
  target_division: string;
  suggested_assignee_id: string | null;
  task_title: string;
  task_description: string | null;
  priority: string;
  due_date: string | null;
  related_event_id: string | null;
  related_deal_id: string | null;
  status: string;
  approver_id: string | null;
  approver_response: string | null;
  final_assignee_id: string | null;
  generated_task_id: string | null;
  decided_at: string | null;
  expires_at: string | null;
  created_at: string | null;
};

const FIELDS =
  "id,requested_by,requester_division,target_division,suggested_assignee_id,task_title,task_description,priority,due_date,related_event_id,related_deal_id,status,approver_id,approver_response,final_assignee_id,generated_task_id,decided_at,expires_at,created_at";

export const HELP_STATUS_LABEL: Record<string, string> = {
  Pending: "Menunggu keputusan",
  Approved: "Disetujui",
  Rejected: "Ditolak",
  Cancelled_By_Requester: "Dibatalkan pemohon",
};

export const HELP_STATUS_CLASS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 animate-pulse",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
  Cancelled_By_Requester: "bg-muted text-muted-foreground",
};

export async function fetchHelpRequests(): Promise<HelpRequest[]> {
  const { data, error } = await db
    .from("help_requests")
    .select(FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HelpRequest[];
}

export type NewHelpRequest = {
  target_division: string;
  task_title: string;
  task_description: string | null;
  priority: string;
  due_date: string | null;
  suggested_assignee_id: string | null;
  related_event_id: string | null;
};

export async function createHelpRequest(input: NewHelpRequest, requesterDivision: string | null) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sesi kamu habis. Masuk lagi ya.");
  const { error } = await db.from("help_requests").insert({
    ...input,
    requested_by: user.id,
    requester_division: requesterDivision,
  });
  if (error) throw error;
}

export async function approveHelpRequest(id: string, finalAssigneeId: string | null) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sesi kamu habis. Masuk lagi ya.");
  const { error } = await db
    .from("help_requests")
    .update({
      status: "Approved",
      approver_id: user.id,
      final_assignee_id: finalAssigneeId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectHelpRequest(id: string, response: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sesi kamu habis. Masuk lagi ya.");
  const { error } = await db
    .from("help_requests")
    .update({
      status: "Rejected",
      approver_id: user.id,
      approver_response: response,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function cancelMyHelpRequest(id: string) {
  const { error } = await db
    .from("help_requests")
    .update({ status: "Cancelled_By_Requester" })
    .eq("id", id);
  if (error) throw error;
}
