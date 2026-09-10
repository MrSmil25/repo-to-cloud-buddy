import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  canManageEvents,
  fetchSpeakerEventCounts,
  fetchSpeakers,
} from "@/lib/events";
import { formatRupiah } from "@/lib/format";
import { useMyProfile } from "@/hooks/useProfile";
import { StorageImage } from "@/components/events/StorageImage";
import { SpeakerFormDialog } from "@/components/speakers/SpeakerFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/speakers/")({
  head: () => ({
    meta: [
      { title: "Speaker — Basis Data Pembicara" },
      { name: "description", content: "Basis data pembicara: keahlian, afiliasi, rate, dan riwayat event." },
      { property: "og:title", content: "Speaker — Basis Data Pembicara" },
      { property: "og:description", content: "Basis data pembicara: keahlian, afiliasi, rate, dan riwayat event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SpeakersPage,
});

function SpeakersPage() {
  const { data: profile } = useMyProfile();
  const canManage = canManageEvents(profile as never);
  const { data: speakers = [], isLoading } = useQuery({ queryKey: ["speakers"], queryFn: fetchSpeakers });
  const { data: counts = {} } = useQuery({
    queryKey: ["speaker-event-counts"],
    queryFn: fetchSpeakerEventCounts,
  });

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of speakers) if (s.companies) map.set(s.companies.id, s.companies.name);
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [speakers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return speakers.filter((s) => {
      if (company !== "all" && s.company_id !== company) return false;
      if (!q) return true;
      return (
        (s.full_name ?? "").toLowerCase().includes(q) ||
        (s.expertise ?? "").toLowerCase().includes(q)
      );
    });
  }, [speakers, search, company]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Speaker</h1>
          <p className="text-sm text-muted-foreground">Basis data pembicara organisasi.</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Tambah Speaker
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau keahlian…"
          className="max-w-xs"
        />
        <Select value={company} onValueChange={setCompany}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Afiliasi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Afiliasi</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Afiliasi</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Total Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">Memuat…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Belum ada speaker.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell>
                      <StorageImage
                        bucket="speakers"
                        path={s.photo_url}
                        alt={s.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                        fallback="—"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link to="/speakers/$id" params={{ id: s.id }} className="hover:underline">
                        {s.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.title || "-"}</TableCell>
                    <TableCell>{s.expertise || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {s.direct_email || s.direct_phone || s.people?.full_name || "-"}
                    </TableCell>
                    <TableCell>{s.companies?.name ?? "-"}</TableCell>
                    <TableCell>{s.default_rate_idr ? formatRupiah(Number(s.default_rate_idr)) : "-"}</TableCell>
                    <TableCell className="text-right">{counts[s.id] ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SpeakerFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
