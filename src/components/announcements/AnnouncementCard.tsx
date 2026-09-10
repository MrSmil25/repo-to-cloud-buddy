import { Check, Eye, MoreVertical, Pencil, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/format";
import { LEVEL_META, type Announcement } from "@/lib/announcements";

export function AnnouncementCard({
  item,
  authorName,
  fromSupervisor = false,
  scopeLabel,
  eventName,
  isRead,
  canManage,
  readStat,
  onMarkRead,
  onOpenStats,
  onEdit,
  onArchive,
  onDelete,
}: {
  item: Announcement;
  authorName: string;
  fromSupervisor?: boolean;
  scopeLabel: string;
  eventName?: string | null;
  isRead: boolean;
  canManage: boolean;
  readStat?: { total_read: number | null; total_target: number | null } | undefined;
  onMarkRead: () => void;
  onOpenStats: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const meta = LEVEL_META[item.level] ?? LEVEL_META["Info"]!;

  return (
    <article className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.accent}`} aria-hidden />
      <div className="space-y-3 p-5 pl-7">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
              {meta.label}
            </span>
            <span className="rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {scopeLabel}
            </span>
            {fromSupervisor && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                ★ Dari Pembina
              </span>
            )}
            {eventName && (
              <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
                🎯 {eventName}
              </span>
            )}
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu pengumuman">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="size-4" /> Arsipkan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="size-4" /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold leading-snug">{item.title}</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{item.body}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            {authorName} · {relativeTime(item.published_at ?? item.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {canManage && readStat && (
              <Button variant="ghost" size="sm" onClick={onOpenStats}>
                <Eye className="size-4" />
                {readStat.total_read ?? 0} dari {readStat.total_target ?? 0} sudah baca
              </Button>
            )}
            {item.requires_ack &&
              (isRead ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" /> Sudah dibaca
                </span>
              ) : (
                <Button size="sm" onClick={onMarkRead}>
                  Saya sudah baca
                </Button>
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}
