import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, MapPin, Pencil, Plus, Trash2, User } from "lucide-react";
import {
  CONFIRMATION_META,
  EVENT_TIMELINE,
  FEE_STATUS_LABELS,
  canManageEvents,
  deleteEventSpeaker,
  fetchEvent,
  fetchEventDeals,
  fetchEventSpeakers,
  fetchEventStats,
  fetchEventTransactions,
  formatDateTimeID,
  formatEventDate,
  type EventSpeakerWithRelations,
} from "@/lib/events";
import { formatDateID, formatRupiah } from "@/lib/format";
import { useMyProfile } from "@/hooks/useProfile";
import { StorageImage } from "@/components/events/StorageImage";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { EventSpeakerDialog } from "@/components/events/EventSpeakerDialog";
import { RundownTab } from "@/components/events/RundownTab";
import { EventStatusBadge, EventTypeBadge } from "@/components/events/EventBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({
    meta: [
      { title: "Detail Event — Manajemen Acara" },
      { name: "description", content: "Detail event: speaker, sponsorship, dan keuangan acara." },
      { property: "og:title", content: "Detail Event — Manajemen Acara" },
      { property: "og:description", content: "Detail event: speaker, sponsorship, dan keuangan acara." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventDetailPage,
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EventDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const canManage = canManageEvents(profile as never);

  const { data: event, isLoading } = useQuery({ queryKey: ["event", id], queryFn: () => fetchEvent(id) });
  const { data: stats } = useQuery({ queryKey: ["event-stats", id], queryFn: () => fetchEventStats(id) });
  const { data: speakers = [] } = useQuery({ queryKey: ["event-speakers", id], queryFn: () => fetchEventSpeakers(id) });
  const { data: deals = [] } = useQuery({ queryKey: ["event-deals", id], queryFn: () => fetchEventDeals(id) });
  const { data: transactions = [] } = useQuery({
    queryKey: ["event-transactions", id],
    queryFn: () => fetchEventTransactions(id),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [speakerOpen, setSpeakerOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EventSpeakerWithRelations | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat event…</p>;
  if (!event) return <p className="text-sm text-muted-foreground">Event tidak ditemukan.</p>;

  const budget = Number(event.budget_idr ?? 0);
  const actual = Number(event.actual_spend_idr ?? 0);
  const over = budget > 0 && actual > budget * 0.8;

  async function removeSpeaker(entryId: string) {
    try {
      await deleteEventSpeaker(entryId);
      await queryClient.invalidateQueries({ queryKey: ["event-speakers", id] });
      await queryClient.invalidateQueries({ queryKey: ["event-stats", id] });
      toast.success("Speaker dihapus dari event");
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/events" className="text-sm text-muted-foreground hover:underline">← Kembali ke Events</Link>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <StorageImage
          bucket="events"
          path={event.poster_url}
          alt={`Poster ${event.name}`}
          className="aspect-[4/3] w-full rounded-lg object-cover"
          fallback="Tanpa poster"
        />
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <EventTypeBadge type={event.event_type} />
                <EventStatusBadge status={event.status} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
            </div>
            {canManage && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            )}
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatEventDate(event.date_start, event.date_end)}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {event.venue || "Venue belum ditentukan"}
              {event.venue_address ? ` — ${event.venue_address}` : ""}
            </p>
            <p className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {event.profiles?.full_name ?? "PIC belum ditentukan"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Speaker" value={String(stats?.speakerCount ?? 0)} />
        <StatCard label="Total Sponsorship" value={formatRupiah(stats?.sponsorshipTotal ?? 0)} />
        <StatCard label="Total Expense" value={formatRupiah(stats?.expenseTotal ?? 0)} />
        <StatCard
          label="Peserta Hadir"
          value={event.status === "Done" ? String(event.actual_attendees ?? 0) : "-"}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="speaker">Speaker</TabsTrigger>
          <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
          <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
          <TabsTrigger value="rundown">Rundown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {event.description || "Belum ada deskripsi."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {event.notes || "Belum ada catatan."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline Status</CardTitle></CardHeader>
            <CardContent>
              <ol className="flex flex-wrap items-center gap-2">
                {EVENT_TIMELINE.map((step, i) => {
                  const currentIndex = EVENT_TIMELINE.indexOf(event.status as never);
                  const done = currentIndex >= i && currentIndex !== -1;
                  return (
                    <li key={step} className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          done ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                      {i < EVENT_TIMELINE.length - 1 && <span className="text-muted-foreground">→</span>}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speaker" className="space-y-4 pt-4">
          {canManage && (
            <Button
              onClick={() => {
                setEditEntry(null);
                setSpeakerOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Speaker ke Event
            </Button>
          )}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Judul Sesi</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Konfirmasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        Belum ada speaker.
                      </TableCell>
                    </TableRow>
                  ) : (
                    speakers.map((es) => {
                      const conf = CONFIRMATION_META[es.confirmation_status ?? ""] ?? { label: "-", className: "" };
                      return (
                        <TableRow key={es.id}>
                          <TableCell>
                            <StorageImage
                              bucket="speakers"
                              path={es.speakers?.photo_url}
                              alt={es.speakers?.full_name ?? "Speaker"}
                              className="h-10 w-10 rounded-full object-cover"
                              fallback="—"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{es.speakers?.full_name ?? "-"}</TableCell>
                          <TableCell>{es.session_title || "-"}</TableCell>
                          <TableCell className="text-xs">
                            {formatDateTimeID(es.session_time_start)}
                            {es.session_time_end ? ` – ${formatDateTimeID(es.session_time_end)}` : ""}
                          </TableCell>
                          <TableCell>
                            {formatRupiah(Number(es.fee_idr ?? 0))}
                            <span className="block text-xs text-muted-foreground">
                              {FEE_STATUS_LABELS[es.fee_status ?? ""] ?? "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={conf.className}>{conf.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canManage && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditEntry(es);
                                    setSpeakerOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => void removeSpeaker(es.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsorship" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        Belum ada sponsorship terkait.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deals.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.companies?.name ?? "-"}</TableCell>
                        <TableCell>
                          <Link to="/pipeline" className="hover:underline">{d.title ?? "-"}</Link>
                        </TableCell>
                        <TableCell>{d.stage ?? "-"}</TableCell>
                        <TableCell className="text-right">{formatRupiah(Number(d.value_idr ?? 0))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keuangan" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Budget vs Realisasi</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Budget: <span className="font-medium">{formatRupiah(budget)}</span></p>
              <p className={over ? "text-destructive" : ""}>
                Realisasi: <span className="font-medium">{formatRupiah(actual)}</span>
              </p>
              <p className="text-muted-foreground">Sisa: {formatRupiah(budget - actual)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Belum ada transaksi terkait event ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{formatDateID(t.transaction_date)}</TableCell>
                        <TableCell>{t.description ?? "-"}</TableCell>
                        <TableCell>{t.transaction_categories?.name ?? "-"}</TableCell>
                        <TableCell>{t.type ?? "-"}</TableCell>
                        <TableCell className="text-right">{formatRupiah(Number(t.amount_idr ?? 0))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rundown" className="pt-4">
          <RundownTab
            eventId={id}
            canManage={canManage}
            dateStart={event.date_start}
            dateEnd={event.date_end}
          />
        </TabsContent>
      </Tabs>

      <EventFormDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      <EventSpeakerDialog open={speakerOpen} onOpenChange={setSpeakerOpen} eventId={id} entry={editEntry} />
    </div>
  );
}
