import { Link } from "@tanstack/react-router";
import {
  HELP_STATUS_CLASS,
  HELP_STATUS_LABEL,
  type HelpRequest,
} from "@/lib/help-requests";
import { TASK_PRIORITY_LABEL } from "@/lib/workspace";
import { formatRemaining, isUrgent } from "@/lib/countdown";
import { formatDateID } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HelpRequestCard({
  request,
  requesterName,
  divisionName,
  canDecide,
  isMine,
  onApprove,
  onReject,
  onCancel,
}: {
  request: HelpRequest;
  requesterName: string;
  divisionName: (code: string | null) => string;
  canDecide?: boolean | undefined;
  isMine?: boolean | undefined;
  onApprove?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}) {
  const pending = request.status === "Pending";
  return (
    <article className="space-y-2 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            HELP_STATUS_CLASS[request.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {HELP_STATUS_LABEL[request.status] ?? request.status}
        </span>
        <span className="text-xs text-muted-foreground">
          Diajukan {formatDateID(request.created_at)}
        </span>
      </div>

      <h3 className="font-semibold leading-snug">{request.task_title}</h3>
      <p className="text-sm text-muted-foreground">
        Dari {requesterName} ({divisionName(request.requester_division)}) → Untuk divisi{" "}
        {divisionName(request.target_division)}
      </p>
      {request.task_description && (
        <p className="text-sm text-muted-foreground">{request.task_description}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Prioritas {TASK_PRIORITY_LABEL[request.priority] ?? request.priority}
        {request.due_date ? ` · Tenggat ${formatDateID(request.due_date)}` : ""}
      </p>

      {pending && (
        <p
          className={cn(
            "text-xs",
            isUrgent(request.expires_at) ? "font-semibold text-red-600" : "text-muted-foreground",
          )}
        >
          Otomatis ditolak {formatRemaining(request.expires_at)} kalau tidak diputuskan.
        </p>
      )}

      {request.status === "Approved" && request.generated_task_id && (
        <Link to="/workspace" className="text-sm font-medium text-primary hover:underline">
          Task sudah dibuat — lihat papan task
        </Link>
      )}

      {request.approver_response && (
        <p className="rounded-lg bg-muted/60 p-2 text-sm text-muted-foreground">
          Catatan Kadiv: {request.approver_response}
        </p>
      )}

      {pending && (canDecide || isMine) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {canDecide && (
            <>
              <Button size="sm" onClick={onApprove}>
                Setujui
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                Tolak
              </Button>
            </>
          )}
          {isMine && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Batalkan request
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
