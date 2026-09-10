import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/UserAvatar";
import { DivisionBadge } from "@/components/DivisionBadge";
import { formatDateID, formatRupiah } from "@/lib/format";
import {
  HEALTH_META,
  TASK_STATUS_LABEL,
  fetchMemberDetail,
  memberHealth,
  progressBarColor,
  type MemberProgress,
} from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { fetchOriginMaps } from "@/lib/task-origin";
import { TaskOriginChip } from "@/components/workspace/TaskOriginChip";

function Metric({
  label,
  value,
  danger,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", danger && "text-red-600")}>{value}</p>
    </div>
  );
}

export function MemberProgressCard({
  member,
  divisionName,
  divisionColor,
  expanded,
  onToggle,
}: {
  member: MemberProgress;
  divisionName?: string | null | undefined;
  divisionColor?: string | null | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const health = HEALTH_META[memberHealth(member)];
  const krAvg = Math.round(Number(member.kr_avg_progress ?? 0));
  const overdue = Number(member.tasks_overdue ?? 0);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["member-detail", member.member_id],
    queryFn: () => fetchMemberDetail(member.member_id),
    enabled: expanded,
  });

  const { data: originMaps } = useQuery({
    queryKey: ["task-origin-maps"],
    queryFn: fetchOriginMaps,
    enabled: expanded,
  });

  return (
    <article className="rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-5 text-left"
      >
        <UserAvatar path={member.photo_url} name={member.full_name} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{member.full_name}</p>
          {member.nickname && (
            <p className="text-xs text-muted-foreground">{member.nickname}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DivisionBadge name={divisionName ?? member.division} colorHex={divisionColor} />
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
              {member.role}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            health.className,
          )}
        >
          {health.label}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2 px-5 sm:grid-cols-3">
        <Metric label="Task Aktif" value={Number(member.tasks_active ?? 0)} />
        <Metric label="Task Selesai" value={Number(member.tasks_done ?? 0)} />
        <Metric label="Task Nunggak" value={overdue} danger={overdue > 0} />
        <Metric label="Deal Aktif" value={Number(member.deals_active ?? 0)} />
        <Metric
          label="Deal Closed"
          value={`${Number(member.deals_closed ?? 0)} · ${formatRupiah(member.deals_value_closed)}`}
        />
        <Metric label="KR Ditanggung" value={Number(member.kr_active ?? 0)} />
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Rata-rata Progress KR</span>
          <span className="font-semibold text-foreground">{krAvg}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", progressBarColor(krAvg))}
            style={{ width: `${Math.min(100, Math.max(0, krAvg))}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t p-5 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Memuat detail…</p>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Task Aktif
                </h4>
                {(detail?.tasks ?? []).length === 0 ? (
                  <p className="mt-1 text-muted-foreground">Tidak ada task aktif.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {detail?.tasks.map((t) => (
                      <li key={t.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <TaskOriginChip task={t} maps={originMaps} />
                          {t.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {TASK_STATUS_LABEL[t.status] ?? t.status} · {formatDateID(t.due_date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Deal yang Dipegang
                </h4>
                {(detail?.deals ?? []).length === 0 ? (
                  <p className="mt-1 text-muted-foreground">Tidak ada deal.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {detail?.deals.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {d.name}
                          {d.companies?.name ? ` · ${d.companies.name}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.stage} · {formatRupiah(d.value_idr)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  Key Result yang Ditanggung
                </h4>
                {(detail?.keyResults ?? []).length === 0 ? (
                  <p className="mt-1 text-muted-foreground">Tidak ada Key Result.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {detail?.keyResults.map((k) => {
                      const p = Math.round(Number(k.progress_percent ?? 0));
                      return (
                        <li key={k.id}>
                          <div className="flex items-center justify-between gap-2">
                            <span>{k.title}</span>
                            <span className="text-xs font-semibold">{p}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", progressBarColor(p))}
                              style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
