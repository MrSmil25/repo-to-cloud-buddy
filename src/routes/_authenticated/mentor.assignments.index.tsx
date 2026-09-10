import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDivisions, useMyProfile, isSupervisor } from "@/hooks/useProfile";
import { AssignmentFormDialog } from "@/components/assignments/AssignmentFormDialog";
import {
  createAssignment,
  fetchAssignmentProgress,
  fetchAssignmentsByCreator,
  scopeLabel,
  type CreateAssignmentInput,
} from "@/lib/assignments";

export const Route = createFileRoute("/_authenticated/mentor/assignments/")({
  head: () => ({
    meta: [
      { title: "Kelola Tugas — OrgTool" },
      {
        name: "description",
        content: "Panel Pembina untuk membuat penugasan dan memantau pengumpulan anggota.",
      },
      { property: "og:title", content: "Kelola Tugas — OrgTool" },
      {
        property: "og:description",
        content: "Panel Pembina untuk membuat penugasan dan memantau pengumpulan anggota.",
      },
    ],
  }),
  component: ManageAssignmentsPage,
});

function ManageAssignmentsPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["mentor-assignments", profile?.id],
    queryFn: () => fetchAssignmentsByCreator(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: progress = [] } = useQuery({
    queryKey: ["assignment-progress"],
    queryFn: fetchAssignmentProgress,
  });

  const save = useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignment(input, profile!.id),
    onSuccess: () => {
      toast.success("Penugasan dibuat.");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["mentor-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-progress"] });
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardList className="size-6 text-primary" /> Kelola Tugas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Penugasan yang Anda berikan kepada anggota beserta rekap pengumpulan.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> Buat Tugas
        </Button>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Belum ada penugasan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const row = progress.find((p) => p.assignment_id === a.id);
            const total = Number(row?.total_target ?? 0);
            const submitted = Number(row?.total_submitted ?? 0);
            const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;
            const divName = divisions.find((d) => d.code === a.target_division)?.name;
            return (
              <Link
                key={a.id}
                to="/mentor/assignments/$id"
                params={{ id: a.id }}
                className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.category && (
                    <span className="rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {a.category}
                    </span>
                  )}
                  <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {scopeLabel(a.scope, divName)}
                  </span>
                  {!a.is_active && (
                    <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      Nonaktif
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-bold">{a.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tenggat:{" "}
                  {a.due_date
                    ? format(new Date(a.due_date), "d MMM yyyy, HH:mm", { locale: idLocale })
                    : "Tanpa tenggat"}
                </p>
                <div className="mt-3 space-y-1">
                  <Progress value={percent} />
                  <p className="text-xs text-muted-foreground">
                    {submitted} dari {total} terkumpul
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <AssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(input) => save.mutate(input)}
        saving={save.isPending}
      />
    </div>
  );
}
