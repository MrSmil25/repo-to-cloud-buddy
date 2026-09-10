import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniBar, healthColor } from "./ProgressRing";
import {
  ACTIVE_TASK_STATUSES,
  ALIGNMENT_META,
  alignmentStatus,
  type AlignmentStatus,
  type KeyResult,
  type TaskRow,
} from "@/lib/command-center";
import type { Division } from "@/hooks/useProfile";

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export type MatrixRow = {
  code: string;
  name: string;
  color: string | null;
  krs: KeyResult[];
  tasks: TaskRow[];
  activeKrCount: number;
  krProgress: number;
  activeTaskCount: number;
  doneRate: number;
  attendanceRate: number | null;
  status: AlignmentStatus;
};

export function buildMatrix(
  divisions: Division[],
  keyResults: KeyResult[],
  tasks: TaskRow[],
  attendanceByDivision: Record<string, number> = {},
): MatrixRow[] {
  return divisions.map((division) => {
    const krs = keyResults.filter((k) => k.owner_division === division.code);
    const divisionTasks = tasks.filter((t) => t.division === division.code);
    const activeKrs = krs.filter((k) => !["Achieved", "Cancelled"].includes(k.status));
    const krProgress =
      krs.length === 0
        ? 0
        : krs.reduce((s, k) => s + Number(k.progress_percent ?? 0), 0) / krs.length;
    const doneCount = divisionTasks.filter((t) => t.status === "Done").length;
    const doneRate = divisionTasks.length === 0 ? 0 : (doneCount / divisionTasks.length) * 100;

    return {
      code: division.code,
      name: division.name,
      color: division.color_hex,
      krs,
      tasks: divisionTasks,
      activeKrCount: activeKrs.length,
      krProgress,
      activeTaskCount: divisionTasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status)).length,
      doneRate,
      attendanceRate: attendanceByDivision[division.code] ?? null,
      status: alignmentStatus(krs.length, divisionTasks.length, krProgress, doneRate),
    };
  });
}

export function AlignmentMatrix({ rows }: { rows: MatrixRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apakah Kerja Divisi Nyambung ke Target?</CardTitle>
        <CardDescription>
          Membandingkan pergerakan Key Result dengan penyelesaian task tiap divisi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="-mx-2 overflow-x-auto px-2">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Divisi</th>
                <th className="py-2 pr-3 font-medium">KR Aktif</th>
                <th className="py-2 pr-3 font-medium">Avg Progress KR</th>
                <th className="py-2 pr-3 font-medium">Task Aktif</th>
                <th className="py-2 pr-3 font-medium">Task Done Rate</th>
                <th className="py-2 pr-3 font-medium">Kehadiran Rapat</th>
                <th className="py-2 font-medium">Status Alignment</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Belum ada data divisi.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const meta = ALIGNMENT_META[row.status];
                const isOpen = expanded === row.code;
                const krColor = healthColor(row.krProgress);
                const taskColor = healthColor(row.doneRate);
                return (
                  <>
                    <tr
                      key={row.code}
                      onClick={() => setExpanded(isOpen ? null : row.code)}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/60"
                    >
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-2 font-medium">
                          {isOpen ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: row.color ?? "var(--muted-foreground)" }}
                          />
                          {row.name}
                        </span>
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{row.activeKrCount}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <MiniBar value={row.krProgress} colorClass={krColor.bar} />
                          <span className="w-10 text-right tabular-nums">
                            {Math.round(row.krProgress)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{row.activeTaskCount}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <MiniBar value={row.doneRate} colorClass={taskColor.bar} />
                          <span className="w-10 text-right tabular-nums">
                            {Math.round(row.doneRate)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 tabular-nums">
                        {row.attendanceRate === null ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          `${row.attendanceRate}%`
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                        >
                          {meta.dot} {row.status}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${row.code}-detail`} className="border-b bg-muted/40">
                        <td colSpan={7} className="p-4">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Key Result Divisi
                              </p>
                              {row.krs.length === 0 && (
                                <p className="text-sm text-muted-foreground">Belum ada Key Result.</p>
                              )}
                              <ul className="space-y-2">
                                {row.krs.map((kr) => (
                                  <li key={kr.id}>
                                    <div className="flex items-center justify-between gap-2 text-sm">
                                      <span className="truncate">{kr.title}</span>
                                      <span className="tabular-nums text-muted-foreground">
                                        {kr.progress_percent ?? 0}%
                                      </span>
                                    </div>
                                    <MiniBar
                                      value={Number(kr.progress_percent ?? 0)}
                                      colorClass={healthColor(Number(kr.progress_percent ?? 0)).bar}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                Task Aktif Teratas
                              </p>
                              {row.tasks.filter((t) => ACTIVE_TASK_STATUSES.includes(t.status))
                                .length === 0 && (
                                <p className="text-sm text-muted-foreground">Tidak ada task aktif.</p>
                              )}
                              <ul className="space-y-1.5">
                                {row.tasks
                                  .filter((t) => ACTIVE_TASK_STATUSES.includes(t.status))
                                  .sort(
                                    (a, b) =>
                                      (PRIORITY_ORDER[a.priority] ?? 9) -
                                      (PRIORITY_ORDER[b.priority] ?? 9),
                                  )
                                  .slice(0, 5)
                                  .map((task) => (
                                    <li
                                      key={task.id}
                                      className="flex items-center justify-between gap-2 text-sm"
                                    >
                                      <span className="truncate">{task.title}</span>
                                      <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                        {task.priority} · {task.status.replace(/_/g, " ")}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Keterangan status
          </p>
          <ul className="space-y-2 text-sm">
            {(Object.keys(ALIGNMENT_META) as AlignmentStatus[]).map((status) => (
              <li
                key={status}
                className={
                  status === "Misalignment"
                    ? "rounded-md border border-destructive/40 bg-destructive/5 p-2"
                    : ""
                }
              >
                <span className="font-medium">
                  {ALIGNMENT_META[status].dot} {status}
                </span>{" "}
                <span
                  className={
                    status === "Misalignment"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  — {ALIGNMENT_META[status].explanation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
