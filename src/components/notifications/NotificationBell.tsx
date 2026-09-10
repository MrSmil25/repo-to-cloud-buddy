import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Mail,
  Wallet,
  CheckSquare,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notifications";
import { useState } from "react";

export function typeIcon(type?: string | null) {
  switch (type) {
    case "surat_review":
      return Mail;
    case "dana_masuk":
      return Wallet;
    case "task_assigned":
      return CheckSquare;
    case "pengumuman":
      return Megaphone;
    case "tugas_pembina":
      return GraduationCap;
    default:
      return Bell;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 45_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications-recent"],
    queryFn: () => fetchNotifications(8),
    refetchInterval: 45_000,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-all"] });
  }

  async function handleClick(n: AppNotification) {
    setOpen(false);
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

  async function handleMarkAll() {
    try {
      await markAllNotificationsRead();
    } catch {
      /* abaikan */
    }
    refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-9 items-center justify-center rounded-lg border transition-colors hover:bg-accent"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-destructive px-1 text-[10px] font-semibold leading-[18px] text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifikasi</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada notifikasi.
            </p>
          )}
          {items.map((n) => {
            const Icon = typeIcon(n.type);
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/40"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${n.is_read ? "" : "font-semibold"}`}
                  >
                    {n.title ?? "Notifikasi"}
                  </span>
                  {n.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {n.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {relativeTime(n.created_at)}
                  </span>
                </span>
                {!n.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAll}>
            Tandai semua dibaca
          </Button>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="px-2 text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
