import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Briefcase, CheckSquare, Clock, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-external";
import { useMyProfile } from "@/hooks/useProfile";
import { formatDateID, formatRupiah } from "@/lib/format";
import {
  createMyTask,
  fetchLinkOptions,
  fetchMyWorkspace,
  isOverdue,
  updateTaskStatus,
  type NewTaskInput,
  type TaskStatus,
} from "@/lib/workspace";
import { setTaskBlocked } from "@/lib/hr";
import { BlockedTaskDialog } from "@/components/hr/BlockedTaskDialog";
import { KanbanBoard } from "@/components/workspace/KanbanBoard";
import { TaskFormDialog } from "@/components/workspace/TaskFormDialog";
import { MyReimbursementNotice } from "@/components/fund-requests/MyReimbursementNotice";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOriginMaps } from "@/lib/task-origin";
import { isKadiv, isBPHOrSupervisor } from "@/lib/hr";
import { CancelRequestDialog } from "@/components/workspace/CancelRequestDialog";
import {
  CancelRequestsPanel,
  usePendingCancelCount,
} from "@/components/workspace/CancelRequestsPanel";
import {
  cancelTaskDirect,
  createCancelRequest,
  fetchMyPendingCancelRequests,
} from "@/lib/cancel-requests";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Ruang Kerja Saya — OrgTool" },
      {
        name: "description",
        content: "Papan kerja pribadi: task yang ditugaskan ke Anda dan deal yang Anda pegang.",
      },
      { property: "og:title", content: "Ruang Kerja Saya — OrgTool" },
      {
        property: "og:description",
        content: "Papan kerja pribadi: task yang ditugaskan ke Anda dan deal yang Anda pegang.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});

function SummaryCard({
  label,
  value,
  icon: Icon,
  danger,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${danger ? "text-red-600" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function WorkspacePage() {
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<{ id: string; title: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const [tab, setTab] = useState<"board" | "cancels">("board");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-workspace", userId],
    queryFn: () => fetchMyWorkspace(userId as string),
    enabled: !!userId,
  });

  const { data: options } = useQuery({
    queryKey: ["task-link-options"],
    queryFn: fetchLinkOptions,
    enabled: formOpen,
  });

  const { data: originMaps } = useQuery({
    queryKey: ["task-origin-maps"],
    queryFn: fetchOriginMaps,
  });

  const kadiv = isKadiv(profile?.role);
  const canDecideCancels = kadiv || isBPHOrSupervisor(profile?.role);
  const pendingCancelCount = usePendingCancelCount();

  const { data: myPendingCancels = [] } = useQuery({
    queryKey: ["my-pending-cancels", userId],
    queryFn: () => fetchMyPendingCancelRequests(userId as string),
    enabled: !!userId,
  });
  const pendingCancelTaskIds = new Set(myPendingCancels.map((r) => r.task_id));

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kadiv ? cancelTaskDirect(id, reason) : createCancelRequest(id, reason),
    onSuccess: () => {
      toast.success(
        kadiv
          ? "Task dibatalkan."
          : "Permintaan dikirim ke Kadiv. Otomatis disetujui dalam 3 hari kalau tidak diputuskan.",
      );
      setCancelTarget(null);
      queryClient.invalidateQueries({ queryKey: ["my-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-cancels"] });
      queryClient.invalidateQueries({ queryKey: ["cancel-requests"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal memproses pembatalan."),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-workspace"] }),
    onError: (e: Error) => toast.error(e.message || "Gagal memindahkan task."),
  });

  const blockMutation = useMutation({
    mutationFn: ({
      id,
      blockedBy,
      reason,
    }: {
      id: string;
      blockedBy: string | null;
      reason: string;
    }) => setTaskBlocked(id, blockedBy, reason),
    onSuccess: () => {
      toast.success("Task ditandai terhambat.");
      setBlockTarget(null);
      queryClient.invalidateQueries({ queryKey: ["my-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["blocker-summary"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menandai task terhambat."),
  });

  const createMutation = useMutation({
    mutationFn: (values: Omit<NewTaskInput, "assignee_id" | "division">) =>
      createMyTask({
        ...values,
        assignee_id: userId as string,
        division: profile?.division ?? null,
      }),
    onSuccess: () => {
      toast.success("Task berhasil dibuat.");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal membuat task."),
  });

  const tasks = data?.tasks ?? [];
  const visibleTasks = showPrivate ? tasks : tasks.filter((t) => !t.is_private);
  const activeTasks = tasks.filter((t) =>
    ["Todo", "In_Progress", "Blocked"].includes(t.status),
  );
  const overdueTasks = tasks.filter((t) => isOverdue(t));
  const deals = data?.deals ?? [];
  const activeDeals = deals.filter(
    (d) => !["Deal", "Rejected", "Ghosted"].includes(d.stage),
  );
  const activeKr = (data?.keyResults ?? []).filter(
    (k) => !["Achieved", "Cancelled"].includes(k.status),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MyReimbursementNotice />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ruang Kerja Saya</h1>
          <p className="text-sm text-muted-foreground">
            Semua task dan deal yang menjadi tanggung jawab Anda dalam satu tempat.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> Task Baru
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))
        ) : (
          <>
            <SummaryCard label="Task Aktif" value={activeTasks.length} icon={CheckSquare} />
            <SummaryCard
              label="Task Nunggak"
              value={overdueTasks.length}
              icon={Clock}
              danger={overdueTasks.length > 0}
            />
            <SummaryCard label="Deal Aktif" value={activeDeals.length} icon={Briefcase} />
            <SummaryCard label="KR Ditanggung" value={activeKr.length} icon={Target} />
          </>
        )}
      </section>

      {canDecideCancels && (
        <div className="flex flex-wrap gap-2">
          {([
            { key: "board" as const, label: "Papan Task Saya" },
            { key: "cancels" as const, label: "Permintaan Pembatalan", badge: pendingCancelCount },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {t.label}
              {!!t.badge && t.badge > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {canDecideCancels && tab === "cancels" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Permintaan Pembatalan</h2>
          <CancelRequestsPanel maps={originMaps} />
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Papan Task Saya</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={showPrivate} onCheckedChange={setShowPrivate} />
              Tampilkan task privat
            </label>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : (
            <KanbanBoard
              tasks={visibleTasks}
              maps={originMaps}
              pendingCancelTaskIds={pendingCancelTaskIds}
              canCancel
              directCancel={kadiv}
              onCancel={(task) => setCancelTarget({ id: task.id, title: task.title })}
              onMove={(id, status) => {
                const task = tasks.find((t) => t.id === id);
                if (!task || task.status === status) return;
                if (status === "Blocked") {
                  setBlockTarget({ id, title: task.title });
                  return;
                }
                moveMutation.mutate({ id, status });
              }}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Tarik kartu task ke kolom lain untuk mengubah statusnya.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Deal Saya</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama Deal</th>
                <th className="px-4 py-3 font-semibold">Perusahaan</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    Belum ada deal yang Anda pegang.
                  </td>
                </tr>
              ) : (
                deals.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <Link to="/command-center" className="hover:underline">
                        {d.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.companies?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                        {d.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatRupiah(d.value_idr)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateID(d.deadline)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Tampilan ini hanya baca. Perubahan deal dilakukan di halaman Pipeline.
        </p>
      </section>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        options={options}
        saving={createMutation.isPending}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <CancelRequestDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        taskTitle={cancelTarget?.title}
        direct={kadiv}
        submitting={cancelMutation.isPending}
        onSubmit={(reason) =>
          cancelTarget && cancelMutation.mutate({ id: cancelTarget.id, reason })
        }
      />

      <BlockedTaskDialog
        open={!!blockTarget}
        taskTitle={blockTarget?.title}
        onOpenChange={(o) => !o && setBlockTarget(null)}
        submitting={blockMutation.isPending}
        onSubmit={({ blockedBy, reason }) =>
          blockTarget && blockMutation.mutate({ id: blockTarget.id, blockedBy, reason })
        }
      />
    </div>
  );
}
