import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { typeIcon } from "@/components/notifications/NotificationBell";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIF_TYPE_LABEL,
  type AppNotification,
} from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi — OrgTool" },
      { name: "description", content: "Semua notifikasi kamu di OrgTool." },
      { property: "og:title", content: "Notifikasi — OrgTool" },
      { property: "og:description", content: "Semua notifikasi kamu di OrgTool." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications-all"],
    queryFn: () => fetchNotifications(),
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["notifications-all"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
  }

  const shown = filter === "unread" ? items.filter((n) => !n.is_read) : items;

  async function open(n: AppNotification) {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* abaikan */
      }
      refresh();
    }
    if (n.link) navigate({ to: n.link as string });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await markAllNotificationsRead().catch(() => {});
            refresh();
          }}
        >
          Tandai semua sudah dibaca
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {f === "all" ? "Semua" : "Belum Dibaca"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Memuat…</p>}
        {!isLoading && shown.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Tidak ada notifikasi.</p>
        )}
        {shown.map((n) => {
          const Icon = typeIcon(n.type);
          return (
            <div key={n.id} className="flex items-start gap-3 border-b p-4 last:border-b-0">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="size-4" />
              </span>
              <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                <p className={`text-sm ${n.is_read ? "" : "font-semibold"}`}>
                  {n.title ?? "Notifikasi"}
                </p>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {n.type && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">
                      {NOTIF_TYPE_LABEL[n.type] ?? n.type}
                    </span>
                  )}
                  <span>{relativeTime(n.created_at)}</span>
                  <span>· {n.is_read ? "Sudah dibaca" : "Belum dibaca"}</span>
                </p>
              </button>
              <button
                aria-label="Hapus notifikasi"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                onClick={async () => {
                  await deleteNotification(n.id).catch(() => {});
                  refresh();
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
