import { supabase } from "@/lib/supabase-external";

export type AppNotification = {
  id: string;
  recipient_id: string;
  type: string | null;
  title: string | null;
  body: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

export const NOTIF_TYPE_LABEL: Record<string, string> = {
  surat_review: "Surat",
  dana_masuk: "Dana",
  task_assigned: "Tugas",
  pengumuman: "Pengumuman",
  tugas_pembina: "Tugas Pembina",
  task_cancel_req: "Permintaan Batal",
  task_cancel_decision: "Keputusan Batal",
  help_req: "Request Bantuan",
  help_decision: "Keputusan Request",
  task_stale: "Task Mangkrak",
};

export async function fetchNotifications(limit?: number): Promise<AppNotification[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return [];
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function fetchUnreadCount(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}
