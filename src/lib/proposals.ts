import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

/* ---------- Status & label ---------- */

export const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  Voting: "Pemungutan Suara",
  Lolos: "Lolos, SP diterbitkan",
  Gagal: "Gagal, tidak mencapai ambang",
  Dibatalkan: "Dibatalkan",
};

export const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  Voting: "bg-amber-100 text-amber-800 animate-pulse",
  Lolos: "bg-red-100 text-red-700",
  Gagal: "bg-muted text-muted-foreground",
  Dibatalkan: "bg-zinc-800 text-zinc-100",
};

export const PROPOSAL_STATUS_ACCENT: Record<string, string> = {
  Voting: "border-l-4 border-l-amber-400",
  Lolos: "border-l-4 border-l-red-600 bg-red-50/40",
  Gagal: "border-l-4 border-l-muted-foreground/40",
  Dibatalkan: "border-l-4 border-l-zinc-700 bg-muted/50",
};

/** Peran yang boleh menjadi sasaran usulan vote (Anggota biasa tidak bisa). */
export const PROPOSABLE_ROLES = [
  "Kadiv",
  "Waketu",
  "Ketua",
  "Sekretaris",
  "Controller",
  "Supervisor",
] as const;

export function scopeLabel(scope?: string | null) {
  if (!scope) return "—";
  if (scope === "Organisasi") return "Seluruh Organisasi";
  if (scope.startsWith("Divisi:")) return `Anggota Divisi ${scope.slice(7)}`;
  return scope;
}

/** Ruang lingkup pemilih yang akan diisi trigger DB. */
export function expectedScope(targetRole?: string | null, targetDivision?: string | null) {
  if (targetRole === "Kadiv") return `Divisi:${targetDivision ?? ""}`;
  return "Organisasi";
}

/* ---------- Tipe ---------- */

export type ProposalRow = {
  id: string;
  target_member_id: string;
  proposed_level: string;
  reason: string;
  linked_task_ids: string[] | null;
  linked_meeting_ids: string[] | null;
  linked_coaching_ids: string[] | null;
  proposed_by: string;
  voter_scope: string;
  target_response: string | null;
  response_submitted_at: string | null;
  voting_starts_at: string | null;
  voting_ends_at: string;
  status: string;
  eligible_voters_count: number | null;
  outcome_recorded_at: string | null;
  created_at: string;
  target: { full_name: string; role: string; division: string | null } | null;
  proposer: { full_name: string; role: string; division: string | null } | null;
};

const FIELDS =
  "id,target_member_id,proposed_level,reason,linked_task_ids,linked_meeting_ids," +
  "linked_coaching_ids,proposed_by,voter_scope,target_response,response_submitted_at," +
  "voting_starts_at,voting_ends_at,status,eligible_voters_count,outcome_recorded_at,created_at," +
  "target:profiles!warning_proposals_target_member_id_fkey(full_name,role,division)," +
  "proposer:profiles!warning_proposals_proposed_by_fkey(full_name,role,division)";

/* ---------- Query ---------- */

export async function fetchProposals() {
  const { data, error } = await db
    .from("warning_proposals")
    .select(FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProposalRow[];
}

export async function fetchProposal(id: string) {
  const { data, error } = await db.from("warning_proposals").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProposalRow | null;
}

export type VoteSummary = {
  votes_cast: number;
  eligible: number;
  agree: number | null;
  disagree: number | null;
  abstain: number | null;
  finished: boolean;
};

/** Ringkasan agregat — tidak pernah memuat identitas pemilih. */
export async function fetchVoteSummary(proposalId: string): Promise<VoteSummary | null> {
  const { data, error } = await db.rpc("proposal_vote_summary", { p_proposal: proposalId });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row ?? null) as VoteSummary | null;
}

export async function hasVoted(proposalId: string): Promise<boolean> {
  const { data, error } = await db.rpc("has_voted", { p_proposal: proposalId });
  if (error) return false;
  return Boolean(data);
}

/** SP hasil usulan yang lolos, kalau ada. */
export async function fetchResultingWarningId(proposalId: string): Promise<string | null> {
  const { data } = await db
    .from("warnings")
    .select("id")
    .eq("linked_proposal_id", proposalId)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/* ---------- Mutasi ---------- */

export type NewProposalInput = {
  target_member_id: string;
  proposed_level: string;
  reason: string;
  linked_task_ids: string[];
  linked_meeting_ids: string[];
  linked_coaching_ids: string[];
  voting_ends_at: string;
};

export async function createProposal(input: NewProposalInput, proposedBy: string) {
  const { error } = await db.from("warning_proposals").insert({
    target_member_id: input.target_member_id,
    proposed_level: input.proposed_level,
    reason: input.reason,
    linked_task_ids: input.linked_task_ids.length ? input.linked_task_ids : null,
    linked_meeting_ids: input.linked_meeting_ids.length ? input.linked_meeting_ids : null,
    linked_coaching_ids: input.linked_coaching_ids.length ? input.linked_coaching_ids : null,
    voting_ends_at: input.voting_ends_at,
    proposed_by: proposedBy,
  });
  if (error) throw error;
}

export async function submitTargetResponse(id: string, response: string) {
  const { error } = await db
    .from("warning_proposals")
    .update({ target_response: response, response_submitted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export const CANCEL_MARK = "[Dibatalkan]";

export async function cancelProposal(id: string, reason: string) {
  const current = await fetchProposal(id);
  const merged = `${current?.reason ?? ""}\n\n${CANCEL_MARK} ${reason}`.trim();
  const { error } = await db
    .from("warning_proposals")
    .update({
      status: "Dibatalkan",
      outcome_recorded_at: new Date().toISOString(),
      reason: merged,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Pisahkan alasan asli dan alasan pembatalan yang ditempelkan di akhir. */
export function splitReason(reason: string) {
  const i = reason.indexOf(CANCEL_MARK);
  if (i < 0) return { reason, cancelReason: null as string | null };
  return {
    reason: reason.slice(0, i).trim(),
    cancelReason: reason.slice(i + CANCEL_MARK.length).trim(),
  };
}

export async function castVote(proposalId: string, voterId: string, choice: string) {
  const { error } = await db
    .from("proposal_votes")
    .insert({ proposal_id: proposalId, voter_id: voterId, choice });
  if (error) {
    if (String(error.code) === "23505") throw new Error("Kamu sudah memberi suara pada usulan ini.");
    throw error;
  }
}

/* ---------- Bantu ---------- */

export function isEligibleVoter(
  proposal: Pick<ProposalRow, "voter_scope" | "target_member_id">,
  profile?: { id: string; division: string | null } | null,
) {
  if (!profile) return false;
  if (proposal.target_member_id === profile.id) return false;
  if (proposal.voter_scope === "Organisasi") return true;
  return proposal.voter_scope === `Divisi:${profile.division ?? ""}`;
}

export function countdownText(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Waktu pemungutan suara sudah lewat";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `Berakhir dalam ${days} hari ${hours} jam`;
  if (hours > 0) return `Berakhir dalam ${hours} jam ${minutes} menit`;
  return `Berakhir dalam ${minutes} menit`;
}
