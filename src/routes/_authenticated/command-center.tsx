import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase-external";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDivisions, useMyProfile } from "@/hooks/useProfile";
import {
  OKR_PERIODS,
  fetchActivity,
  fetchFinance,
  fetchOkr,
  fetchAttendanceByDivision,
  fetchOkrSnapshots,
  fetchRedFlags,
  fetchStuckMoney,
  fetchTasks,
  periodLabel,
  takeOkrSnapshot,
} from "@/lib/command-center";
import { relativeTime } from "@/lib/format";
import {
  CardSkeleton,
  ExecutionCard,
  FinanceHealthCard,
  ObjectiveHealthCard,
  PipelineCard,
} from "@/components/command-center/HealthCards";
import { AlignmentMatrix, buildMatrix } from "@/components/command-center/AlignmentMatrix";
import { RedFlags } from "@/components/command-center/RedFlags";
import { Momentum } from "@/components/command-center/Momentum";
import { ActivityFeed } from "@/components/command-center/ActivityFeed";
import { StuckMoney } from "@/components/command-center/StuckMoney";

export const Route = createFileRoute("/_authenticated/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — Dashboard Alignment Organisasi" },
      {
        name: "description",
        content:
          "Pantau kesehatan organisasi: progress OKR, keuangan, pipeline, eksekusi task, dan deteksi misalignment antar divisi dalam satu halaman.",
      },
      { property: "og:title", content: "Command Center — Dashboard Alignment Organisasi" },
      {
        property: "og:description",
        content:
          "Command center untuk Ketua, Waketu, dan Kadiv: kesehatan organisasi, alignment matrix divisi, dan red flags otomatis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommandCenterPage,
});

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return <Skeleton className={`w-full rounded-xl ${height}`} />;
}

function CommandCenterPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: divisions } = useDivisions();
  const [period, setPeriod] = useState<string | null>(null);

  const role = profile?.role ?? "Anggota";
  const isOrgWide =
    role === "Ketua" ||
    role === "Waketu" ||
    role === "Sekretaris" ||
    role === "Controller" ||
    role === "Supervisor";
  const isMemberOnly = role === "Anggota";
  const myDivision = profile?.division ?? null;

  // Periode berjalan = periode yang paling banyak memuat Objective.
  const periodsQuery = useQuery({
    queryKey: ["cc-periods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("objectives" as never).select("period");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as unknown as { period: string }[]) {
        counts.set(row.period, (counts.get(row.period) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? OKR_PERIODS[0];
    },
  });

  const activePeriod = period ?? periodsQuery.data ?? OKR_PERIODS[0];

  const okrQuery = useQuery({
    queryKey: ["cc-okr", activePeriod],
    queryFn: () => fetchOkr(activePeriod),
    enabled: !!activePeriod,
  });
  const financeQuery = useQuery({ queryKey: ["cc-finance"], queryFn: fetchFinance });
  const tasksQuery = useQuery({ queryKey: ["cc-tasks"], queryFn: fetchTasks });
  const flagsQuery = useQuery({
    queryKey: ["cc-flags", activePeriod],
    queryFn: () => fetchRedFlags(activePeriod),
    enabled: !!activePeriod,
  });
  const activityQuery = useQuery({ queryKey: ["cc-activity"], queryFn: fetchActivity });
  const snapshotsQuery = useQuery({
    queryKey: ["cc-snapshots", activePeriod],
    queryFn: () => fetchOkrSnapshots(activePeriod),
    enabled: !!activePeriod,
  });
  const stuckMoneyQuery = useQuery({ queryKey: ["cc-stuck-money"], queryFn: fetchStuckMoney });
  const attendanceQuery = useQuery({
    queryKey: ["cc-attendance"],
    queryFn: fetchAttendanceByDivision,
  });

  const snapshotMutation = useMutation({
    mutationFn: () => takeOkrSnapshot(activePeriod),
    onSuccess: () => {
      toast.success("Snapshot tersimpan. Data ini akan mengisi grafik momentum.");
      queryClient.invalidateQueries({ queryKey: ["cc-snapshots", activePeriod] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lastUpdated = Math.max(
    okrQuery.dataUpdatedAt,
    financeQuery.dataUpdatedAt,
    tasksQuery.dataUpdatedAt,
    flagsQuery.dataUpdatedAt,
    activityQuery.dataUpdatedAt,
  );

  const matrixRows = useMemo(() => {
    if (!divisions || !okrQuery.data || !tasksQuery.data) return [];
    const rows = buildMatrix(
      divisions,
      okrQuery.data.keyResults,
      tasksQuery.data,
      attendanceQuery.data ?? {},
    );
    if (isOrgWide) return rows;
    if (isMemberOnly) return rows.filter((r) => r.code === myDivision);
    return [...rows].sort((a, b) =>
      a.code === myDivision ? -1 : b.code === myDivision ? 1 : 0,
    );
  }, [
    divisions,
    okrQuery.data,
    tasksQuery.data,
    attendanceQuery.data,
    isOrgWide,
    isMemberOnly,
    myDivision,
  ]);

  const visibleFlags = useMemo(() => {
    const flags = flagsQuery.data ?? [];
    if (!isMemberOnly) return flags;
    return flags.filter((f) => !f.division || f.division === myDivision);
  }, [flagsQuery.data, isMemberOnly, myDivision]);

  const visibleTasks = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    if (!isMemberOnly) return tasks;
    return tasks.filter((t) => t.division === myDivision);
  }, [tasksQuery.data, isMemberOnly, myDivision]);

  function refreshAll() {
    queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("cc-") });
  }

  const isRefreshing =
    okrQuery.isFetching || financeQuery.isFetching || tasksQuery.isFetching || flagsQuery.isFetching;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground">
            {isMemberOnly
              ? `Tampilan divisi ${myDivision ?? "-"} (hanya baca)`
              : isOrgWide
                ? "Kesehatan seluruh organisasi"
                : `Divisi ${myDivision ?? "-"} + ringkasan organisasi`}
            {lastUpdated > 0 && ` · diperbarui ${relativeTime(new Date(lastUpdated).toISOString())}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activePeriod} onValueChange={setPeriod}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {OKR_PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isMemberOnly && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => snapshotMutation.mutate()}
              disabled={snapshotMutation.isPending}
            >
              <Camera className="size-4" />
              <span className="hidden sm:inline">
                {snapshotMutation.isPending ? "Menyimpan..." : "📸 Simpan Snapshot Minggu Ini"}
              </span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        {!isMemberOnly && (
          <p className="w-full text-xs text-muted-foreground">
            Ambil snapshot rutin tiap minggu (misal tiap Jumat) agar grafik momentum terisi.
          </p>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {okrQuery.isLoading ? (
          <CardSkeleton />
        ) : (
          <ObjectiveHealthCard objectives={okrQuery.data?.objectives ?? []} />
        )}
        {financeQuery.isLoading ? (
          <CardSkeleton />
        ) : (
          <FinanceHealthCard
            balance={financeQuery.data?.balance ?? 0}
            pipelineValue={financeQuery.data?.pipelineValue ?? 0}
          />
        )}
        {financeQuery.isLoading ? (
          <CardSkeleton />
        ) : (
          <PipelineCard
            activeCount={financeQuery.data?.activeDeals.length ?? 0}
            closedCount={financeQuery.data?.closedCount ?? 0}
            closedValue={financeQuery.data?.closedValue ?? 0}
            stageCounts={financeQuery.data?.stageCounts ?? []}
          />
        )}
        {tasksQuery.isLoading ? <CardSkeleton /> : <ExecutionCard tasks={visibleTasks} />}
      </section>

      {okrQuery.isLoading || tasksQuery.isLoading ? (
        <SectionSkeleton height="h-96" />
      ) : (
        <AlignmentMatrix rows={matrixRows} />
      )}

      {stuckMoneyQuery.isLoading ? (
        <SectionSkeleton height="h-52" />
      ) : stuckMoneyQuery.data ? (
        <StuckMoney data={stuckMoneyQuery.data} />
      ) : null}

      {flagsQuery.isLoading ? <SectionSkeleton /> : <RedFlags flags={visibleFlags} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {snapshotsQuery.isLoading ? (
          <SectionSkeleton height="h-80" />
        ) : (
          <Momentum snapshots={snapshotsQuery.data ?? []} />
        )}
        {activityQuery.isLoading ? (
          <SectionSkeleton height="h-80" />
        ) : (
          <ActivityFeed items={activityQuery.data ?? []} />
        )}
      </div>
    </div>
  );
}
