import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import {
  CONFIRMATION_META,
  canManageEvents,
  fetchSpeaker,
  fetchSpeakerEvents,
  formatDateTimeID,
} from "@/lib/events";
import { formatDateID, formatRupiah } from "@/lib/format";
import { useMyProfile } from "@/hooks/useProfile";
import { StorageImage } from "@/components/events/StorageImage";
import { SpeakerFormDialog } from "@/components/speakers/SpeakerFormDialog";
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

export const Route = createFileRoute("/_authenticated/speakers/$id")({
  head: () => ({
    meta: [
      { title: "Detail Speaker — Profil Pembicara" },
      { name: "description", content: "Profil pembicara lengkap dengan keahlian, kontak, dan riwayat event." },
      { property: "og:title", content: "Detail Speaker — Profil Pembicara" },
      { property: "og:description", content: "Profil pembicara lengkap dengan keahlian, kontak, dan riwayat event." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SpeakerDetailPage,
});

function SpeakerDetailPage() {
  const { id } = Route.useParams();
  const { data: profile } = useMyProfile();
  const canManage = canManageEvents(profile as never);
  const { data: speaker, isLoading } = useQuery({ queryKey: ["speaker", id], queryFn: () => fetchSpeaker(id) });
  const { data: history = [] } = useQuery({
    queryKey: ["speaker-events", id],
    queryFn: () => fetchSpeakerEvents(id),
  });
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat speaker…</p>;
  if (!speaker) return <p className="text-sm text-muted-foreground">Speaker tidak ditemukan.</p>;

  return (
    <div className="space-y-6">
      <Link to="/speakers" className="text-sm text-muted-foreground hover:underline">← Kembali ke Speaker</Link>

      <div className="flex flex-wrap items-start gap-4">
        <StorageImage
          bucket="speakers"
          path={speaker.photo_url}
          alt={speaker.full_name}
          className="h-24 w-24 rounded-full object-cover"
          fallback="—"
        />
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{speaker.full_name}</h1>
          <p className="text-sm text-muted-foreground">{speaker.title || "-"}</p>
          <p className="text-sm text-muted-foreground">{speaker.expertise || "-"}</p>
        </div>
        {canManage && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Event</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Afiliasi: </span>{speaker.companies?.name ?? "-"}</p>
              <p><span className="text-muted-foreground">Kontak perantara: </span>{speaker.people?.full_name ?? "-"}</p>
              <p><span className="text-muted-foreground">Email: </span>{speaker.direct_email || "-"}</p>
              <p><span className="text-muted-foreground">Phone: </span>{speaker.direct_phone || "-"}</p>
              <p>
                <span className="text-muted-foreground">Default rate: </span>
                {speaker.default_rate_idr ? formatRupiah(Number(speaker.default_rate_idr)) : "-"}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Bio: </span>{speaker.bio_short || "-"}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Catatan: </span>{speaker.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Judul Sesi</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Konfirmasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Belum ada riwayat event.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => {
                      const conf = CONFIRMATION_META[h.confirmation_status ?? ""] ?? { label: "-", className: "" };
                      return (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">
                            {h.events ? (
                              <Link to="/events/$id" params={{ id: h.events.id }} className="hover:underline">
                                {h.events.name}
                              </Link>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{formatDateID(h.events?.date_start ?? null)}</TableCell>
                          <TableCell>{h.session_title || "-"}</TableCell>
                          <TableCell className="text-xs">{formatDateTimeID(h.session_time_start)}</TableCell>
                          <TableCell>{formatRupiah(Number(h.fee_idr ?? 0))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={conf.className}>{conf.label}</Badge>
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
      </Tabs>

      <SpeakerFormDialog open={editOpen} onOpenChange={setEditOpen} speaker={speaker} />
    </div>
  );
}
