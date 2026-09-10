import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { AnnouncementFormDialog } from "@/components/announcements/AnnouncementFormDialog";
import { ReadStatusDialog } from "@/components/announcements/ReadStatusDialog";
import { isBPH, useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  archiveAnnouncement,
  createAnnouncement,
  deactivateAnnouncement,
  fetchActiveAnnouncements,
  fetchActiveEvents,
  fetchMyReadIds,
  fetchReadStatus,
  markAsRead,
  updateAnnouncement,
  type Announcement,
  type AnnouncementInput,
} from "@/lib/announcements";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "Pengumuman — OrgTool" },
      {
        name: "description",
        content: "Pengumuman organisasi dan divisi beserta konfirmasi baca anggota.",
      },
      { property: "og:title", content: "Pengumuman — OrgTool" },
      {
        property: "og:description",
        content: "Pengumuman organisasi dan divisi beserta konfirmasi baca anggota.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const { data: profiles = [] } = useProfiles();
  const bph = isBPH(profile?.role);
  const canCreate = bph || profile?.role === "Kadiv";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchActiveAnnouncements,
  });
  const { data: readIds = [] } = useQuery({
    queryKey: ["announcement-reads", profile?.id],
    queryFn: () => fetchMyReadIds(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: stats = [] } = useQuery({
    queryKey: ["announcement-read-status"],
    queryFn: fetchReadStatus,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["announcement-events"],
    queryFn: fetchActiveEvents,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [statsFor, setStatsFor] = useState<Announcement | null>(null);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcement-read-status"] });
    queryClient.invalidateQueries({ queryKey: ["urgent-announcements"] });
  }

  const save = useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      if (editing) await updateAnnouncement(editing.id, input);
      else await createAnnouncement(input, profile!.id);
    },
    onSuccess: () => {
      toast.success(editing ? "Pengumuman diperbarui." : "Pengumuman dipublikasikan.");
      setFormOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const read = useMutation({
    mutationFn: (id: string) => markAsRead(id, profile!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcement-reads"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-read-status"] });
      queryClient.invalidateQueries({ queryKey: ["urgent-announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deactivateAnnouncement(id),
    onSuccess: () => {
      toast.success("Pengumuman dihapus dari daftar aktif.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: (id: string) => archiveAnnouncement(id),
    onSuccess: () => {
      toast.success("Pengumuman diarsipkan.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Megaphone className="size-6 text-primary" /> Pengumuman
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informasi penting dari pengurus organisasi dan divisi Anda.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Buat Pengumuman
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Belum ada pengumuman aktif.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const canManage = bph || item.author_id === profile?.id;
            const stat = stats.find((s) => s.announcement_id === item.id);
            return (
              <AnnouncementCard
                key={item.id}
                item={item}
                authorName={
                  profiles.find((p) => p.id === item.author_id)?.full_name ?? "Pengurus"
                }
                fromSupervisor={
                  profiles.find((p) => p.id === item.author_id)?.role === "Supervisor"
                }
                scopeLabel={
                  item.scope === "Organisasi"
                    ? "Organisasi"
                    : (divisions.find((d) => d.code === item.target_division)?.name ??
                      item.target_division ??
                      "Divisi")
                }
                eventName={events.find((e) => e.id === item.related_event_id)?.name ?? null}
                isRead={readIds.includes(item.id)}
                canManage={canManage}
                readStat={stat}
                onMarkRead={() => read.mutate(item.id)}
                onOpenStats={() => setStatsFor(item)}
                onEdit={() => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onArchive={() => archive.mutate(item.id)}
                onDelete={() => remove.mutate(item.id)}
              />
            );
          })}
        </div>
      )}

      <AnnouncementFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        isBPH={bph}
        myDivision={profile?.division ?? null}
        onSubmit={(input) => save.mutate(input)}
        saving={save.isPending}
      />
      <ReadStatusDialog item={statsFor} onOpenChange={(open) => !open && setStatsFor(null)} />
    </div>
  );
}
