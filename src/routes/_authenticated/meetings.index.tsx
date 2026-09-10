import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, CalendarDays, MapPin, Users, Gavel, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MeetingFormDialog } from "@/components/meetings/MeetingFormDialog";
import { useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  createMeeting,
  fetchMeetings,
  fetchAttendanceRecap,
  formatMeetingDateTime,
  canManageMeetings,
  canRecapAttendance,
  MEETING_TYPES,
  MEETING_TYPE_CLASS,
  MEETING_TYPE_LABEL,
  type MeetingType,
  type NewMeeting,
} from "@/lib/meetings";

export const Route = createFileRoute("/_authenticated/meetings/")({
  head: () => ({
    meta: [
      { title: "Rapat & Notulensi | OrgTool" },
      {
        name: "description",
        content:
          "Kelola jadwal rapat, notulensi, keputusan, dan presensi anggota organisasi dalam satu tempat.",
      },
      { property: "og:title", content: "Rapat & Notulensi" },
      {
        property: "og:description",
        content: "Jadwal rapat, notulensi, keputusan, dan rekap kehadiran anggota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles } = useProfiles();
  const { data: divisions } = useDivisions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [division, setDivision] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  const nameOf = useMemo(() => {
    const map = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? "Anggota") : "-");
  }, [profiles]);

  const rows = (meetings ?? []).filter((m) => {
    if (type !== "all" && m.meeting_type !== type) return false;
    if (division !== "all" && m.division !== division) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    const d = m.meeting_date ? new Date(m.meeting_date) : null;
    if (from && d && d < new Date(from)) return false;
    if (to && d && d > new Date(`${to}T23:59:59`)) return false;
    return true;
  });

  const create = useMutation({
    mutationFn: (input: NewMeeting) => createMeeting(input),
    onSuccess: () => {
      toast.success("Rapat berhasil dibuat.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canCreate = canManageMeetings(profile?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapat</h1>
          <p className="text-sm text-muted-foreground">
            Notulensi, keputusan, dan presensi rapat organisasi.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Buat Rapat
          </Button>
        )}
      </div>

      <Tabs defaultValue="daftar">
        <TabsList>
          <TabsTrigger value="daftar">Daftar Rapat</TabsTrigger>
          {canRecapAttendance(profile?.role) && (
            <TabsTrigger value="rekap">Rekap Presensi</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="daftar" className="space-y-4 pt-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari judul rapat"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipe rapat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tipe</SelectItem>
                  {MEETING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MEETING_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua divisi</SelectItem>
                  {(divisions ?? []).map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Belum ada rapat yang cocok dengan filter.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rows.map((m) => (
                <Link key={m.id} to="/meetings/$id" params={{ id: m.id }} className="block">
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{m.title}</h2>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${MEETING_TYPE_CLASS[m.meeting_type as MeetingType]}`}
                          >
                            {MEETING_TYPE_LABEL[m.meeting_type as MeetingType]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="size-4" />
                            {formatMeetingDateTime(m.meeting_date)}
                          </span>
                          {m.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-4" />
                              {m.location}
                            </span>
                          )}
                          <span>Dipimpin: {nameOf(m.led_by)}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Gavel className="size-4" />
                          {m.decisions_count} keputusan
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="size-4" />
                          {m.attendance_present}/{m.attendance_total} hadir
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {canRecapAttendance(profile?.role) && (
          <TabsContent value="rekap" className="pt-4">
            <RecapTab nameOf={nameOf} />
          </TabsContent>
        )}
      </Tabs>

      <MeetingFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(input) => create.mutate(input)}
        submitting={create.isPending}
      />
    </div>
  );
}

function RecapTab({ nameOf }: { nameOf: (id: string | null | undefined) => string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance-recap"],
    queryFn: fetchAttendanceRecap,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.length === 0)
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Belum ada data presensi.
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anggota</TableHead>
              <TableHead className="text-right">Diundang</TableHead>
              <TableHead className="text-right">Hadir</TableHead>
              <TableHead className="text-right">Izin</TableHead>
              <TableHead className="text-right">Sakit</TableHead>
              <TableHead className="text-right">Alpa</TableHead>
              <TableHead className="text-right">Terlambat</TableHead>
              <TableHead className="text-right">Kehadiran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r) => (
              <TableRow key={r.member_id}>
                <TableCell className="font-medium">{nameOf(r.member_id)}</TableCell>
                <TableCell className="text-right">{r.invited}</TableCell>
                <TableCell className="text-right">{r.Hadir}</TableCell>
                <TableCell className="text-right">{r.Izin}</TableCell>
                <TableCell className="text-right">{r.Sakit}</TableCell>
                <TableCell className="text-right">{r.Alpa}</TableCell>
                <TableCell className="text-right">{r.Terlambat}</TableCell>
                <TableCell className="text-right font-semibold">{r.percent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
