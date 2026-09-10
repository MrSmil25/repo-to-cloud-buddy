import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreVertical, Plus } from "lucide-react";
import {
  deleteRundown,
  fetchRundown,
  formatDayID,
  formatTimeID,
  type RundownItem,
} from "@/lib/events";
import { UserAvatar } from "@/components/UserAvatar";
import { DivisionBadge } from "@/components/DivisionBadge";
import { RundownFormDialog } from "@/components/events/RundownFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RundownTab({
  eventId,
  canManage,
  dateStart,
  dateEnd,
}: {
  eventId: string;
  canManage: boolean;
  dateStart?: string | null;
  dateEnd?: string | null;
}) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["event-rundown", eventId],
    queryFn: () => fetchRundown(eventId),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RundownItem | null>(null);

  const multiDay = !!dateStart && !!dateEnd && dateStart !== dateEnd;
  const nextSortOrder = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.sort_order ?? 0)) + 10 : 10),
    [items],
  );

  async function remove(id: string) {
    try {
      await deleteRundown(id);
      await queryClient.invalidateQueries({ queryKey: ["event-rundown", eventId] });
      toast.success("Item rundown dihapus");
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Item
        </Button>
      )}

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat rundown…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada item rundown.</p>
          ) : (
            <ol className="relative space-y-6 border-l pl-6">
              {items.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium tabular-nums text-muted-foreground">
                        {multiDay && item.time_start ? `${formatDayID(item.time_start)} · ` : ""}
                        {formatTimeID(item.time_start)} - {formatTimeID(item.time_end)}
                      </p>
                      <p className="font-semibold">{item.activity}</p>
                      {item.notes && (
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p>
                      )}
                      {item.profiles && (
                        <div className="flex items-center gap-2 pt-1">
                          <UserAvatar
                            path={item.profiles.photo_url}
                            name={item.profiles.full_name}
                            className="size-7 text-xs"
                          />
                          <span className="text-sm">{item.profiles.full_name}</span>
                          <DivisionBadge name={item.profiles.division} />
                        </div>
                      )}
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(item);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => void remove(item.id)}>
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <RundownFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventId={eventId}
        item={editing}
        defaultDate={dateStart ?? null}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
