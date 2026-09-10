import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WARNING_LEVEL_BADGE, WARNING_LEVEL_LABEL } from "@/lib/warnings";
import {
  countdownText,
  fetchVoteSummary,
  PROPOSAL_STATUS_ACCENT,
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_LABEL,
  scopeLabel,
  splitReason,
  type ProposalRow,
} from "@/lib/proposals";

export function ProposalCard({
  proposal,
  canCancel,
  onCancel,
}: {
  proposal: ProposalRow;
  canCancel?: boolean;
  onCancel?: (p: ProposalRow) => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const summary = useQuery({
    queryKey: ["proposal-summary", proposal.id, proposal.status],
    queryFn: () => fetchVoteSummary(proposal.id),
  });
  const s = summary.data;
  const { reason, cancelReason } = splitReason(proposal.reason);

  return (
    <article
      className={`rounded-2xl border bg-card p-5 shadow-sm ${PROPOSAL_STATUS_ACCENT[proposal.status] ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${PROPOSAL_STATUS_BADGE[proposal.status] ?? "bg-secondary"}`}
          >
            {PROPOSAL_STATUS_LABEL[proposal.status] ?? proposal.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${WARNING_LEVEL_BADGE[proposal.proposed_level] ?? "bg-secondary"}`}
          >
            {WARNING_LEVEL_LABEL[proposal.proposed_level] ?? proposal.proposed_level}
          </span>
        </div>
        {canCancel && proposal.status === "Voting" && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCancel?.(proposal)}>
                Batalkan Usulan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Link
        to="/warnings/proposals/$id"
        params={{ id: proposal.id }}
        className="mt-3 block hover:underline"
      >
        <p className="text-base font-semibold">
          {proposal.target?.full_name ?? "—"}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({proposal.target?.role ?? "—"}
            {proposal.target?.division ? ` · ${proposal.target.division}` : ""})
          </span>
        </p>
      </Link>

      <p className="mt-1 text-xs text-muted-foreground">
        Diajukan oleh {proposal.proposer?.full_name ?? "—"} ({proposal.proposer?.role ?? "—"}) ·
        Ruang lingkup pemilih: {scopeLabel(proposal.voter_scope)}
      </p>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm">{reason}</p>

      {proposal.status === "Voting" && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          {countdownText(proposal.voting_ends_at)}
        </p>
      )}

      {s && (
        <p className="mt-1 text-xs text-muted-foreground">
          {s.finished && s.agree !== null
            ? `Hasil akhir: ${s.agree} setuju, ${s.disagree} tidak setuju, ${s.abstain} abstain dari ${s.eligible} berhak`
            : `${s.votes_cast} dari ${s.eligible} berhak sudah memilih`}
        </p>
      )}

      {cancelReason && (
        <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
          <span className="font-semibold">Alasan pembatalan: </span>
          {cancelReason}
        </p>
      )}
    </article>
  );
}
