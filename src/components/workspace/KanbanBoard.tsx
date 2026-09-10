import { useState } from "react";
import { Briefcase, Calendar, Lock, MoreVertical, Target } from "lucide-react";
import {
  PRIORITY_CLASS,
  TASK_PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  isOverdue,
  type MyTask,
  type TaskStatus,
} from "@/lib/workspace";
import { formatDateID } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OriginMaps } from "@/lib/task-origin";
import { TaskOriginChip } from "@/components/workspace/TaskOriginChip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CancelHandler = (task: MyTask) => void;

function TaskCard({
  task,
  maps,
  pendingCancel,
  canCancel,
  directCancel,
  onCancel,
  onDragStart,
}: {
  task: MyTask;
  maps?: OriginMaps | undefined;
  pendingCancel?: boolean | undefined;
  canCancel?: boolean | undefined;
  directCancel?: boolean | undefined;
  onCancel?: CancelHandler | undefined;
  onDragStart: () => void;
}) {
  const overdue = isOverdue(task);
  const cancellable =
    !!onCancel && !!canCancel && task.status !== "Done" && task.status !== "Cancelled";

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className="cursor-grab space-y-2 rounded-xl border bg-card p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <TaskOriginChip task={task} maps={maps} />
          {pendingCancel && (
            <span className="ml-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              Menunggu pembatalan
            </span>
          )}
          <p className="text-sm font-medium leading-snug">{task.title}</p>
        </div>
        {cancellable && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Aksi task"
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pendingCancel ? (
                <DropdownMenuItem disabled>Menunggu keputusan Kadiv</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onCancel?.(task)}>
                  {directCancel ? "Batalkan task" : "Ajukan pembatalan"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            PRIORITY_CLASS[task.priority] ?? PRIORITY_CLASS['Medium'],
          )}
        >
          {TASK_PRIORITY_LABEL[task.priority] ?? task.priority}
        </span>
        {task.is_private && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="size-3" /> Privat
          </span>
        )}
        {task.key_result_id && (
          <span title="Terkait Key Result" className="text-[11px]">
            <Target className="size-3.5 text-primary" />
          </span>
        )}
        {task.related_event_id && (
          <span title="Terkait Event" className="text-[11px]">
            <Calendar className="size-3.5 text-primary" />
          </span>
        )}
        {task.related_deal_id && (
          <span title="Terkait Deal" className="text-[11px]">
            <Briefcase className="size-3.5 text-primary" />
          </span>
        )}
      </div>
      {task.due_date && (
        <p className={cn("text-xs", overdue ? "font-semibold text-red-600" : "text-muted-foreground")}>
          {overdue ? "Nunggak: " : "Tenggat: "}
          {formatDateID(task.due_date)}
        </p>
      )}
    </article>
  );
}

export function KanbanBoard({
  tasks,
  onMove,
  maps,
  pendingCancelTaskIds,
  canCancel,
  directCancel,
  onCancel,
}: {
  tasks: MyTask[];
  onMove: (id: string, status: TaskStatus) => void;
  maps?: OriginMaps | undefined;
  pendingCancelTaskIds?: Set<string> | undefined;
  canCancel?: boolean | undefined;
  directCancel?: boolean | undefined;
  onCancel?: CancelHandler | undefined;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={() => {
              if (dragId) onMove(dragId, status);
              setDragId(null);
              setOverCol(null);
            }}
            className={cn(
              "flex min-h-40 flex-col gap-3 rounded-2xl border bg-muted/40 p-3 transition-colors",
              overCol === status && "border-primary bg-primary/5",
            )}
          >
            <header className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{TASK_STATUS_LABEL[status]}</h3>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {items.length}
              </span>
            </header>
            {items.length === 0 ? (
              <p className="px-1 text-xs text-muted-foreground">Belum ada task di sini.</p>
            ) : (
              items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  maps={maps}
                  pendingCancel={pendingCancelTaskIds?.has(t.id)}
                  canCancel={canCancel}
                  directCancel={directCancel}
                  onCancel={onCancel}
                  onDragStart={() => setDragId(t.id)}
                />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
