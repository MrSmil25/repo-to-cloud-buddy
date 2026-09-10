import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, MapPin, Plus, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/UserAvatar";
import { MeetingFormDialog } from "@/components/meetings/MeetingFormDialog";
import {
  DecisionFormDialog,
  type DecisionFormValue,
} from "@/components/meetings/DecisionFormDialog";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import { formatDateID } from "@/lib/format";
import {
  ATTENDANCE_CLASS,
  ATTENDANCE_STATUSES,
  canEditMeeting,
  canManageMeetings,
  createDecision,
  createTaskFromDecision,
  fetchAttendance,
  fetchDecisions,
  fetchMeeting,
  formatMeetingDateTime,
  MEETING_TYPE_CLASS,
  MEETING_TYPE_LABEL,
  saveAttendance,
  updateMeeting,
  type MeetingType,
  type NewMeeting,
} from "@/lib/meetings";

export const Route = createFileRoute("/_authenticated/meetings/$id")({
  head: () => ({
    meta: [
      { title: "Detail Rapat | OrgTool" },
      {
        name: "description",
        content: "Notulensi lengkap, daftar keputusan beserta PIC, dan presensi anggota rapat.",
      },
      { property: "og:title", content: "Detail Rapat" },
      {
        property: "og:description",
        content: "Notulensi, keputusan, dan presensi anggota untuk rapat ini.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingDetail,
});

function MeetingDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles } = useProfiles();
  const [editOpen, setEditOpen] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id),
  });

  const nameOf = useMemo(() => {
    const map = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return (pid: string | null | undefined) => (pid ? (map.get(pid) ?? "Anggota") : "-");
  }, [profiles]);

  const canEdit = canEditMeeting(meeting, profile?.id, profile?.role);

  const update = useMutation({
    mutationFn: (patch: Partial<NewMeeting>) => updateMeeting(id, patch),
    onSuccess: () => {
      toast.success("Rapat diperbarui.");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!meeting)
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Rapat tidak ditemukan atau Anda tidak punya akses.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-6">
      <Link
        to="/meetings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Kembali ke daftar rapat
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${MEETING_TYPE_CLASS[meeting.meeting_type as MeetingType]}`}
              >
                {MEETING_TYPE_LABEL[meeting.meeting_type as MeetingType]}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatMeetingDateTime(meeting.meeting_date)}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {meeting.location}
                </span>
              )}
              <span>Dipimpin: {nameOf(meeting.led_by)}</span>
              <span>Notulen: {nameOf(meeting.recorded_by)}</span>
            </div>
          </div>
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="notulensi">
        <TabsList>
          <TabsTrigger value="notulensi">Notulensi</TabsTrigger>
          <TabsTrigger value="keputusan">Keputusan</TabsTrigger>
          <TabsTrigger value="presensi">Presensi</TabsTrigger>
        </TabsList>

        <TabsContent value="notulensi" className="pt-4">
          <NotesTab
            meetingId={id}
            agenda={meeting.agenda}
            notes={meeting.notes}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="keputusan" className="pt-4">
          <DecisionsTab meetingId={id} canEdit={canEdit} nameOf={nameOf} />
        </TabsContent>

        <TabsContent value="presensi" className="pt-4">
          <AttendanceTab
            meetingId={id}
            division={meeting.meeting_type === "Rapat_Divisi" ? meeting.division : null}
            canEdit={canEdit || canManageMeetings(profile?.role)}
          />
        </TabsContent>
      </Tabs>

      <MeetingFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Rapat"
        initial={{
          title: meeting.title,
          meeting_type: meeting.meeting_type as MeetingType,
          meeting_date: meeting.meeting_date,
          location: meeting.location,
          division: meeting.division,
          related_event_id: meeting.related_event_id,
          agenda: meeting.agenda,
          led_by: meeting.led_by,
        }}
        onSubmit={(input) => update.mutate(input)}
        submitting={update.isPending}
      />
    </div>
  );
}

function NotesTab({
  meetingId,
  agenda,
  notes,
  canEdit,
}: {
  meetingId: string;
  agenda: string | null;
  notes: string | null;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(notes ?? "");
  useEffect(() => setValue(notes ?? ""), [notes]);

  const save = useMutation({
    mutationFn: () => updateMeeting(meetingId, { notes: value }),
    onSuccess: () => {
      toast.success("Notulensi tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {agenda?.trim() ? agenda : "Belum ada agenda."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notulensi Lengkap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {canEdit ? (
            <>
              <Textarea
                rows={14}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Tulis jalannya rapat, poin pembahasan, dan catatan penting..."
              />
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-sm">
              {notes?.trim() ? notes : "Belum ada notulensi."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsTab({
  meetingId,
  canEdit,
  nameOf,
}: {
  meetingId: string;
  canEdit: boolean;
  nameOf: (id: string | null | undefined) => string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: decisions, isLoading } = useQuery({
    queryKey: ["meeting-decisions", meetingId],
    queryFn: () => fetchDecisions(meetingId),
  });
  const { data: profiles } = useProfiles();

  const photoOf = useMemo(() => {
    const map = new Map((profiles ?? []).map((p) => [p.id, p.photo_url]));
    return (id: string | null | undefined) => (id ? (map.get(id) ?? null) : null);
  }, [profiles]);

  const add = useMutation({
    mutationFn: async (value: DecisionFormValue) => {
      const created = await createDecision({
        meeting_id: meetingId,
        decision: value.decision.trim(),
        pic_id: value.pic_id,
        due_date: value.due_date,
      });
      if (value.makeTask) await createTaskFromDecision(created.id);
      return { created, madeTask: value.makeTask };
    },
    onSuccess: (res) => {
      toast.success(
        res.madeTask
          ? `Keputusan disimpan & task di-assign ke ${nameOf(res.created.pic_id)}.`
          : "Keputusan disimpan.",
      );
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["meeting-decisions", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makeTask = useMutation({
    mutationFn: (decisionId: string) => createTaskFromDecision(decisionId),
    onSuccess: (_data, decisionId) => {
      const pic = (decisions ?? []).find((d) => d.id === decisionId)?.pic_id;
      toast.success(`Task dibuat & di-assign ke ${nameOf(pic)}.`);
      queryClient.invalidateQueries({ queryKey: ["meeting-decisions", meetingId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Tambah Keputusan
        </Button>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (decisions ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Belum ada keputusan yang dicatat.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(decisions ?? []).map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                <div className="min-w-0 space-y-2">
                  <p className="whitespace-pre-wrap text-sm font-medium">{d.decision}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <UserAvatar
                        path={photoOf(d.pic_id)}
                        name={nameOf(d.pic_id)}
                        className="size-6 text-[10px]"
                      />
                      {nameOf(d.pic_id)}
                    </span>
                    {d.due_date && <span>Tenggat: {formatDateID(d.due_date)}</span>}
                  </div>
                </div>
                {d.generated_task_id ? (
                  <Link
                    to="/workspace"
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                  >
                    <CheckCircle2 className="size-3.5" /> Task dibuat
                  </Link>
                ) : (
                  canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => makeTask.mutate(d.id)}
                      disabled={makeTask.isPending}
                    >
                      Jadikan Task
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DecisionFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(v) => add.mutate(v)}
        submitting={add.isPending}
      />
    </div>
  );
}

function AttendanceTab({
  meetingId,
  division,
  canEdit,
}: {
  meetingId: string;
  division: string | null;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: profiles } = useProfiles();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["meeting-attendance", meetingId],
    queryFn: () => fetchAttendance(meetingId),
  });

  const members = useMemo(
    () =>
      (profiles ?? []).filter(
        (p) => p.status === "Active" && (!division || p.division === division),
      ),
    [profiles, division],
  );

  const [rows, setRows] = useState<Record<string, { status: string; note: string }>>({});

  useEffect(() => {
    const next: Record<string, { status: string; note: string }> = {};
    for (const m of members) next[m.id] = { status: "Alpa", note: "" };
    for (const a of existing ?? []) {
      if (a.member_id) next[a.member_id] = { status: a.status, note: a.note ?? "" };
    }
    setRows(next);
  }, [members, existing]);

  const save = useMutation({
    mutationFn: () =>
      saveAttendance(
        meetingId,
        Object.entries(rows).map(([member_id, v]) => ({
          member_id,
          status: v.status,
          note: v.note.trim() || null,
        })),
      ),
    onSuccess: () => {
      toast.success("Presensi tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["meeting-attendance", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-recap"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const values = Object.values(rows);
  const count = (s: string) => values.filter((v) => v.status === s).length;

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">
            <span className="font-semibold">{count("Hadir")}</span> Hadir ·{" "}
            <span className="font-semibold">{count("Izin")}</span> Izin ·{" "}
            <span className="font-semibold">{count("Sakit")}</span> Sakit ·{" "}
            <span className="font-semibold">{count("Alpa")}</span> Alpa ·{" "}
            <span className="font-semibold">{count("Terlambat")}</span> Terlambat dari{" "}
            {members.length} anggota
          </p>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setRows((prev) =>
                    Object.fromEntries(
                      Object.entries(prev).map(([k, v]) => [k, { ...v, status: "Hadir" }]),
                    ),
                  )
                }
              >
                Tandai Semua Hadir
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Menyimpan..." : "Simpan Presensi"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y p-0">
          {members.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Tidak ada anggota aktif untuk didata.
            </p>
          )}
          {members.map((m) => {
            const row = rows[m.id] ?? { status: "Alpa", note: "" };
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 p-3">
                <UserAvatar path={m.photo_url} name={m.full_name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.division ?? "-"}</p>
                </div>
                {canEdit ? (
                  <>
                    <Select
                      value={row.status}
                      onValueChange={(v) =>
                        setRows((prev) => ({ ...prev, [m.id]: { ...row, status: v } }))
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-full sm:w-56"
                      placeholder="Catatan (opsional)"
                      value={row.note}
                      onChange={(e) =>
                        setRows((prev) => ({ ...prev, [m.id]: { ...row, note: e.target.value } }))
                      }
                    />
                  </>
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ATTENDANCE_CLASS[row.status] ?? ""}`}
                  >
                    {row.status}
                  </span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
