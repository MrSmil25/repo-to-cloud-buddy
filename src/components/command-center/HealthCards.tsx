import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import { MiniBar, ProgressRing, healthColor } from "./ProgressRing";
import type { Objective, TaskRow } from "@/lib/command-center";
import { ACTIVE_TASK_STATUSES } from "@/lib/command-center";

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-3 w-40" />
      </CardContent>
    </Card>
  );
}

export function ObjectiveHealthCard({ objectives }: { objectives: Objective[] }) {
  const avg =
    objectives.length === 0
      ? 0
      : objectives.reduce((s, o) => s + Number(o.progress_percent ?? 0), 0) / objectives.length;
  const onTrack = objectives.filter((o) => o.status === "On_Track" || o.status === "Achieved").length;
  const color = healthColor(avg);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Progress Objectives</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ProgressRing value={avg} colorClass={color.text} />
        <div>
          <p className={`text-3xl font-bold ${color.text}`}>{Math.round(avg)}%</p>
          <p className="text-xs text-muted-foreground">
            {onTrack} dari {objectives.length} Objective On Track
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceHealthCard({
  balance,
  pipelineValue,
}: {
  balance: number;
  pipelineValue: number;
}) {
  const positive = balance >= 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Kesehatan Finansial</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold break-words ${positive ? "text-emerald-600" : "text-destructive"}`}
        >
          {formatRupiah(balance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pipeline: {formatRupiah(pipelineValue)}
        </p>
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              positive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            {positive ? "Saldo sehat" : "Saldo minus"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineCard({
  activeCount,
  closedCount,
  closedValue,
  stageCounts,
}: {
  activeCount: number;
  closedCount: number;
  closedValue: number;
  stageCounts: { stage: string; count: number }[];
}) {
  const max = Math.max(1, ...stageCounts.map((s) => s.count));
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Pipeline Eksternal</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{activeCount}</p>
        <p className="text-xs text-muted-foreground">
          {closedCount} Deal Closed | {formatRupiahShort(closedValue)} Total Value
        </p>
        <div className="mt-3 space-y-1">
          {stageCounts.map((s) => (
            <div key={s.stage} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] text-muted-foreground">
                {s.stage.replace(/_/g, " ")}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
              <span className="w-5 text-right text-[11px] tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const TASK_SLICES = [
  { status: "Done", className: "text-emerald-600" },
  { status: "In_Progress", className: "text-sky-500" },
  { status: "Todo", className: "text-amber-500" },
  { status: "Blocked", className: "text-destructive" },
];

export function ExecutionCard({ tasks }: { tasks: TaskRow[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const rate = total === 0 ? 0 : (done / total) * 100;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    (t) => !["Done", "Cancelled"].includes(t.status) && t.due_date && t.due_date < today,
  ).length;
  const color = healthColor(rate);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">Eksekusi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ProgressRing value={rate} size={72} stroke={8} colorClass={color.text} />
          <div>
            <p className={`text-2xl font-bold ${color.text}`}>{Math.round(rate)}%</p>
            <p className={`text-xs ${overdue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {overdue} Task Overdue
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {TASK_SLICES.map((slice) => {
            const count = tasks.filter((t) => t.status === slice.status).length;
            return (
              <div key={slice.status} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] text-muted-foreground">
                  {slice.status.replace(/_/g, " ")}
                </span>
                <MiniBar
                  value={total === 0 ? 0 : (count / total) * 100}
                  colorClass={slice.className.replace("text-", "bg-")}
                />
                <span className="w-5 text-right text-[11px] tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {tasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status)).length} task masih aktif
        </p>
      </CardContent>
    </Card>
  );
}
