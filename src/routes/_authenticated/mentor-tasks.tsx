import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GraduationCap, Lock, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyProfile } from "@/hooks/useProfile";
import { useMyAssignments, useMySubmissions } from "@/hooks/useAssignments";
import {
  signedFileUrl,
  uploadSubmissionFile,
  upsertSubmission,
  visibilityHint,
  type Assignment,
  type AssignmentSubmission,
} from "@/lib/assignments";

export const Route = createFileRoute("/_authenticated/mentor-tasks")({
  head: () => ({
    meta: [
      { title: "Tugas dari Pembina — OrgTool" },
      {
        name: "description",
        content: "Daftar penugasan dari Pembina beserta status pengumpulan dan catatan.",
      },
      { property: "og:title", content: "Tugas dari Pembina — OrgTool" },
      {
        property: "og:description",
        content: "Daftar penugasan dari Pembina beserta status pengumpulan dan catatan.",
      },
    ],
  }),
  component: MentorTasksPage,
});

function dueMeta(due: string | null) {
  if (!due) return { label: "Tanpa tenggat", urgent: false };
  const date = new Date(due);
  const urgent = isBefore(date, new Date(Date.now() + 2 * 86_400_000));
  return {
    label: format(date, "d MMM yyyy, HH:mm", { locale: idLocale }),
    urgent,
  };
}

function AssignmentCard({
  item,
  submission,
  onClick,
}: {
  item: Assignment;
  submission?: AssignmentSubmission | undefined;
  onClick: () => void;
}) {
  const due = dueMeta(item.due_date);
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border bg-card p-5 text-left shadow-sm transition-colors hover:bg-accent/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        {item.category && (
          <span className="rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {item.category}
          </span>
        )}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            submission
              ? "border-primary/30 bg-primary/10 text-primary"
              : due.urgent
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "bg-muted"
          }`}
        >
          {submission ? "Sudah dikumpulkan" : "Belum dikumpulkan"}
        </span>
      </div>
      <h3 className="mt-2 text-base font-bold leading-snug">{item.title}</h3>
      {item.instructions && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.instructions}</p>
      )}
      <p
        className={`mt-3 text-xs font-medium ${
          !submission && due.urgent ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        Tenggat: {due.label}
      </p>
      {submission?.supervisor_comment && (
        <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          Ada catatan dari Pembina
        </p>
      )}
    </button>
  );
}

function DetailDialog({
  item,
  submission,
  onClose,
}: {
  item: Assignment | null;
  submission?: AssignmentSubmission | undefined;
  onClose: () => void;
}) {
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState<string | null>(null);

  useEffect(() => {
    setContent(submission?.content ?? "");
    setFile(null);
    setFileLink(null);
    if (submission?.file_url) {
      signedFileUrl(submission.file_url).then(setFileLink).catch(() => setFileLink(null));
    }
  }, [submission, item?.id]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!item || !profile) return;
      let fileUrl = submission?.file_url ?? null;
      if (file) fileUrl = await uploadSubmissionFile(file, profile.id);
      await upsertSubmission({
        assignmentId: item.id,
        memberId: profile.id,
        content: item.allow_text ? content.trim() || null : null,
        fileUrl,
      });
    },
    onSuccess: () => {
      toast.success("Jawaban tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const due = dueMeta(item?.due_date ?? null);

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.title}</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Tenggat: {due.label}</p>
            {item.instructions && (
              <p className="whitespace-pre-line rounded-xl bg-muted p-3 text-sm">
                {item.instructions}
              </p>
            )}

            {submission?.supervisor_comment && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Catatan dari Pembina
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">{submission.supervisor_comment}</p>
              </div>
            )}

            {submission && (
              <p className="text-xs text-muted-foreground">
                Dikumpulkan{" "}
                {submission.submitted_at
                  ? format(new Date(submission.submitted_at), "d MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })
                  : "-"}
              </p>
            )}

            {item.allow_text && (
              <div className="space-y-2">
                <Label>Jawaban kamu</Label>
                <Textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis jawaban di sini…"
                />
              </div>
            )}

            {item.allow_file && (
              <div className="space-y-2">
                <Label>Lampiran</Label>
                {fileLink && (
                  <a
                    href={fileLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-primary underline"
                  >
                    <Paperclip className="size-4" /> Lihat lampiran yang sudah dikirim
                  </a>
                )}
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              {visibilityHint(item.visibility)}
            </p>

            <Button
              className="w-full"
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
            >
              {submit.isPending
                ? "Menyimpan…"
                : submission
                  ? "Perbarui Jawaban"
                  : "Kumpulkan"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MentorTasksPage() {
  const { data: assignments = [], isLoading } = useMyAssignments();
  const { data: submissions = [] } = useMySubmissions();
  const [openId, setOpenId] = useState<string | null>(null);

  const byAssignment = new Map(submissions.map((s) => [s.assignment_id, s]));
  const pending = assignments.filter((a) => !byAssignment.has(a.id));
  const done = assignments.filter((a) => byAssignment.has(a.id));
  const active = assignments.find((a) => a.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <GraduationCap className="size-6 text-primary" /> Tugas dari Pembina
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Penugasan yang ditujukan untuk kamu beserta catatan dari Pembina.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Belum ada tugas dari Pembina.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
              BELUM DIKUMPULKAN ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semua tugas sudah kamu kumpulkan. 🎉</p>
            ) : (
              pending.map((a) => (
                <AssignmentCard key={a.id} item={a} onClick={() => setOpenId(a.id)} />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
              SUDAH DIKUMPULKAN ({done.length})
            </h2>
            {done.map((a) => (
              <AssignmentCard
                key={a.id}
                item={a}
                submission={byAssignment.get(a.id)}
                onClick={() => setOpenId(a.id)}
              />
            ))}
          </section>
        </div>
      )}

      <DetailDialog
        item={active}
        submission={active ? byAssignment.get(active.id) : undefined}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
