import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Radar, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  fetchAssignmentProgress,
  fetchAssignmentsByCreator,
  fetchSubmissions,
} from "@/lib/assignments";

export function SupervisorOverview() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();

  const { data: assignments = [] } = useQuery({
    queryKey: ["mentor-assignments", profile?.id],
    queryFn: () => fetchAssignmentsByCreator(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: progress = [] } = useQuery({
    queryKey: ["assignment-progress"],
    queryFn: fetchAssignmentProgress,
  });

  const active = assignments.filter((a) => a.is_active);
  const rates = active.map((a) => {
    const row = progress.find((p) => p.assignment_id === a.id);
    const total = Number(row?.total_target ?? 0);
    const submitted = Number(row?.total_submitted ?? 0);
    return total > 0 ? (submitted / total) * 100 : 0;
  });
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

  const { data: recent = [] } = useQuery({
    queryKey: ["supervisor-recent-submissions", active.map((a) => a.id).join(",")],
    queryFn: async () => {
      const lists = await Promise.all(active.slice(0, 10).map((a) => fetchSubmissions(a.id)));
      return lists
        .flat()
        .filter((s) => !s.supervisor_comment)
        .sort(
          (x, y) =>
            new Date(y.submitted_at ?? 0).getTime() - new Date(x.submitted_at ?? 0).getTime(),
        )
        .slice(0, 5);
    },
    enabled: active.length > 0,
  });

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Ringkasan Pengawasan</h2>
        <p className="text-sm text-muted-foreground">
          {active.length} tugas aktif · rata-rata pengumpulan {avgRate}%
        </p>
        <div className="mt-2">
          <Progress value={avgRate} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/command-center"
          className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium hover:bg-accent/40"
        >
          <Radar className="size-4 text-primary" /> Command Center
        </Link>
        <Link
          to="/fund-approvals"
          className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium hover:bg-accent/40"
        >
          <ShieldCheck className="size-4 text-primary" /> Persetujuan Dana
        </Link>
        <Link
          to="/mentor/assignments"
          className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium hover:bg-accent/40"
        >
          <ClipboardList className="size-4 text-primary" /> Kelola Tugas
        </Link>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Pengumpulan terbaru yang belum dikomentari</h3>
        {recent.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Tidak ada yang menunggu catatan.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recent.map((s) => {
              const member = profiles.find((p) => p.id === s.member_id);
              const assignment = assignments.find((a) => a.id === s.assignment_id);
              return (
                <li key={s.id}>
                  <Link
                    to="/mentor/assignments/$id"
                    params={{ id: s.assignment_id ?? "" }}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm hover:bg-accent/40"
                  >
                    <span className="font-medium">
                      {member?.full_name ?? "Anggota"} · {assignment?.title ?? "Tugas"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.submitted_at
                        ? format(new Date(s.submitted_at), "d MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })
                        : "-"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
