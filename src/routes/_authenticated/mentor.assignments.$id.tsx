import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { useDivisions, useMyProfile, useProfiles, isSupervisor } from "@/hooks/useProfile";
import {
  commentSubmission,
  fetchAssignment,
  fetchAssignmentTargets,
  fetchSubmissions,
  scopeLabel,
  setAssignmentActive,
  signedFileUrl,
  visibilityHint,
} from "@/lib/assignments";

export const Route = createFileRoute("/_authenticated/mentor/assignments/$id")({
  head: () => ({
    meta: [
      { title: "Detail Tugas — OrgTool" },
      { name: "description", content: "Rekap pengumpulan dan catatan Pembina untuk satu tugas." },
      { property: "og:title", content: "Detail Tugas — OrgTool" },
      {
        property: "og:description",
        content: "Rekap pengumpulan dan catatan Pembina untuk satu tugas.",
      },
    ],
  }),
  component: AssignmentDetailPage,
});

function FileLink({ path }: { path: string }) {
  const { data: url } = useQuery({
    queryKey: ["submission-file", path],
    queryFn: () => signedFileUrl(path),
  });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-2 text-sm text-primary underline"
    >
      <Paperclip className="size-4" /> Lihat lampiran
    </a>
  );
}

function AssignmentDetailPage() {
  const { id } = Route.useParams();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => fetchAssignment(id),
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ["assignment-submissions", id],
    queryFn: () => fetchSubmissions(id),
  });
  const { data: targetIds = [] } = useQuery({
    queryKey: ["assignment-targets", id],
    queryFn: () => fetchAssignmentTargets(id),
    enabled: assignment?.scope === "Individu",
  });

  const comment = useMutation({
    mutationFn: (vars: { submissionId: string; text: string }) =>
      commentSubmission(vars.submissionId, vars.text, profile!.id),
    onSuccess: () => {
      toast.success("Catatan terkirim.");
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: () => setAssignmentActive(id, !assignment?.is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["mentor-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profile && !isSupervisor(profile.role)) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Halaman ini hanya untuk Pembina.</p>
      </div>
    );
  }

  if (isLoading || !assignment) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const activeMembers = profiles.filter((p) => p.status === "Active");
  const targets =
    assignment.scope === "Semua"
      ? activeMembers
      : assignment.scope === "Divisi"
        ? activeMembers.filter((p) => p.division === assignment.target_division)
        : activeMembers.filter((p) => targetIds.includes(p.id));

  const submittedIds = new Set(submissions.map((s) => s.member_id));
  const notYet = targets.filter((p) => !submittedIds.has(p.id));
  const percent = targets.length > 0 ? Math.round((submissions.length / targets.length) * 100) : 0;
  const divName = divisions.find((d) => d.code === assignment.target_division)?.name;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/mentor/assignments"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Kembali
      </Link>

      <header className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{assignment.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {scopeLabel(assignment.scope, divName)} ·{" "}
              {assignment.due_date
                ? format(new Date(assignment.due_date), "d MMM yyyy, HH:mm", { locale: idLocale })
                : "Tanpa tenggat"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toggleActive.mutate()}>
            {assignment.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
        {assignment.instructions && (
          <p className="mt-3 whitespace-pre-line rounded-xl bg-muted p-3 text-sm">
            {assignment.instructions}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{visibilityHint(assignment.visibility)}</p>
        <div className="mt-4 space-y-1">
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">
            {submissions.length} dari {targets.length} terkumpul
          </p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Belum mengumpulkan ({notYet.length})</h2>
        {notYet.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Semua sasaran sudah mengumpulkan.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {notYet.map((p) => (
              <span key={p.id} className="rounded-full border bg-muted px-3 py-1 text-xs">
                {p.full_name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          KUMPULAN ({submissions.length})
        </h2>
        {submissions.map((s) => {
          const member = profiles.find((p) => p.id === s.member_id);
          return (
            <article key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <UserAvatar path={member?.photo_url} name={member?.full_name} className="size-9" />
                <div>
                  <p className="text-sm font-semibold">{member?.full_name ?? "Anggota"}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.submitted_at
                      ? format(new Date(s.submitted_at), "d MMM yyyy, HH:mm", { locale: idLocale })
                      : "-"}
                  </p>
                </div>
              </div>

              {s.content && (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-muted p-3 text-sm">
                  {s.content}
                </p>
              )}
              {s.file_url && <FileLink path={s.file_url} />}

              {s.supervisor_comment && (
                <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Catatan Anda
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm">{s.supervisor_comment}</p>
                </div>
              )}

              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  placeholder="Tulis catatan untuk anggota ini…"
                  value={drafts[s.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  disabled={!((drafts[s.id] ?? "").trim()) || comment.isPending}
                  onClick={() =>
                    comment.mutate(
                      { submissionId: s.id, text: (drafts[s.id] ?? "").trim() },
                      { onSuccess: () => setDrafts((d) => ({ ...d, [s.id]: "" })) },
                    )
                  }
                >
                  Kirim Catatan
                </Button>
              </div>
            </article>
          );
        })}
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada yang mengumpulkan.</p>
        )}
      </section>
    </div>
  );
}
