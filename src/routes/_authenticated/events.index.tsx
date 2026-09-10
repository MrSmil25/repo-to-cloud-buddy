import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Plus, User } from "lucide-react";
import {
  EVENT_STATUSES,
  EVENT_STATUS_META,
  EVENT_TYPES,
  EVENT_TYPE_META,
  canManageEvents,
  fetchEvents,
  formatEventDate,
} from "@/lib/events";
import { formatRupiahShort } from "@/lib/format";
import { useMyProfile } from "@/hooks/useProfile";
import { StorageImage } from "@/components/events/StorageImage";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { EventStatusBadge, EventTypeBadge } from "@/components/events/EventBadges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "Events — Manajemen Acara Organisasi" },
      { name: "description", content: "Kelola seluruh event organisasi: jadwal, venue, PIC, budget, dan speaker." },
      { property: "og:title", content: "Events — Manajemen Acara Organisasi" },
      { property: "og:description", content: "Kelola seluruh event organisasi: jadwal, venue, PIC, budget, dan speaker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: profile } = useMyProfile();
  const { data: events = [], isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const canManage = canManageEvents(profile as never);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.date_start) set.add(String(new Date(e.date_start).getFullYear()));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [events]);

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (status !== "all" && e.status !== status) return false;
        if (type !== "all" && e.event_type !== type) return false;
        if (year !== "all") {
          if (!e.date_start) return false;
          if (String(new Date(e.date_start).getFullYear()) !== year) return false;
        }
        return true;
      }),
    [events, status, type, year],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">Seluruh acara organisasi beserta anggaran dan speaker.</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Buat Event
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {EVENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{EVENT_STATUS_META[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{EVENT_TYPE_META[t]?.label ?? t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tahun" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat event…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada event yang cocok dengan filter.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((event) => {
            const budget = Number(event.budget_idr ?? 0);
            const actual = Number(event.actual_spend_idr ?? 0);
            const over = budget > 0 && actual > budget * 0.8;
            return (
              <Link key={event.id} to="/events/$id" params={{ id: event.id }} className="group">
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <StorageImage
                    bucket="events"
                    path={event.poster_url}
                    alt={`Poster ${event.name}`}
                    className="aspect-[4/3] w-full object-cover"
                    fallback="Tanpa poster"
                  />
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <EventTypeBadge type={event.event_type} />
                      <EventStatusBadge status={event.status} />
                    </div>
                    <h2 className="line-clamp-2 font-semibold leading-snug group-hover:underline">{event.name}</h2>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatEventDate(event.date_start, event.date_end)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.venue || "Venue belum ditentukan"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {event.profiles?.full_name ?? "PIC belum ditentukan"}
                    </p>
                    <p className={`text-xs font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>
                      {formatRupiahShort(actual)} / {formatRupiahShort(budget)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <EventFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
