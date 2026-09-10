import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export type CancelRequest = {
  id: string;
  task_id: string;
  requested_by: string;
  reason: string;
  status: string;
  approver_id: string | null;
  approver_response: string | null;
  decided_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  tasks?: { id: string; title: string; status: string; division: string | null } | null;
};

const FIELDS =
  "id,task_id,requested_by,reason,status,approver_id,approver_response,decided_at,expires_at,created_at,tasks(id,title,status,division)";

export async function fetchCancelRequests(): Promise<CancelRequest[]> {
  const { data, error } = await db
    .from("task_cancel_requests")
    .select(FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CancelRequest[];
}

export async function fetchMyPendingCancelRequests(userId: string): Promise<CancelRequest[]> {
  const { data, error } = await db
    .from("task_cancel_requests")
    .select(FIELDS)
    .eq("requested_by", userId)
    .eq("status", "Pending");
  if (error) throw error;
  return (data ?? []) as CancelRequest[];
}

export async function createCancelRequest(taskId: string, reason: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sesi kamu habis. Masuk lagi ya.");
  const { error } = await db
    .from("task_cancel_requests")
    .insert({ task_id: taskId, requested_by: user.id, reason });
  if (error) throw error;
}

export async function decideCancelRequest(
  id: string,
  approve: boolean,
  response?: string | null,
) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sesi kamu habis. Masuk lagi ya.");

  // Hanya update tabel task_cancel_requests. Trigger apply_cancel_decision akan
  // otomatis mengubah tasks.status menjadi 'Cancelled' saat status = 'Approved'.
  const patch: Record<string, unknown> = {
    status: approve ? "Approved" : "Rejected",
    approver_id: user.id,
  };
  if (!approve) {
    patch["approver_response"] = response ?? null;
  }

  const { error } = await db.from("task_cancel_requests").update(patch).eq("id", id);
  if (error) throw error;
}

/** Kadiv boleh langsung membatalkan task di divisinya. */
export async function cancelTaskDirect(taskId: string, reason: string) {
  const { data: task, error: readError } = await db
    .from("tasks")
    .select("description")
    .eq("id", taskId)
    .maybeSingle();
  if (readError) throw readError;
  const description = [task?.description, `Dibatalkan Kadiv: ${reason}`]
    .filter(Boolean)
    .join("\n\n");
  const { error } = await db
    .from("tasks")
    .update({ status: "Cancelled", description })
    .eq("id", taskId);
  if (error) throw error;
}
