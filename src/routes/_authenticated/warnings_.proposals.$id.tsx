import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMyProfile } from "@/hooks/useProfile";
import { WARNING_LEVEL_BADGE, WARNING_LEVEL_LABEL } from "@/lib/warnings";
import {
  castVote,
  countdownText,
  fetchProposal,
  fetchResultingWarningId,
  fetchVoteSummary,
  hasVoted,
  isEligibleVoter,
  PROPOSAL_STATUS_BADGE,
  PROPOSAL_STATUS_LABEL,
  scopeLabel,
  splitReason,
  submitTargetResponse,
} from "@/lib/proposals";
import { supabase } from "@/lib/supabase-external";

export const Route = createFileRoute("/_authenticated/warnings_/proposals/$id")({
  head: () => ({
    meta: [
      { title: "Detail Usulan Peringatan — OrgTool" },
      {
        name: "description",
        content: "Rincian usulan peringatan, bukti, sanggahan sasaran, dan pemungutan suara.",
      },
      { property: "og:title", content: "Detail Usulan Peringatan — OrgTool" },
      {
        property: "og:description",
        content: "Rincian usulan peringatan, bukti, sanggahan sasaran, dan pemungutan suara.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProposalDetailPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-red-700">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm">Usulan tidak ditemukan.</p>,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (t: string) => any };

const CHOICES = [
  { value: "Setuju", label: "Setuju", cls: "bg-red-100 text-red-800 hover:bg-red-200" },
  {
    value: "Tidak_Setuju",
    label: "Tidak Setuju",
    cls: "bg-sky-100 text-sky-800 hover:bg-sky-200",
  },
  { value: "Abstain", label: "Abstain", cls: "bg-muted text-foreground hover:bg-accent" },
];

function ProposalDetailPage() {
  const { id } = Route.useParams();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const [response, setResponse] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const proposalQ = useQuery({ queryKey: ["proposal", id], queryFn: () => fetchProposal(id) });
  const p = proposalQ.data;

  const summaryQ = useQuery({
    queryKey: ["proposal-summary", id, p?.status],
    queryFn: () => fetchVoteSummary(id),
    enabled: !!p,
  });
  const votedQ = useQuery({
    queryKey: ["proposal-voted", id, profile?.id],
    queryFn: () => hasVoted(id),
    enabled: !!p && !!profile,
  });
  const resultingQ = useQuery({
    queryKey: ["proposal-warning", id],
    queryFn: () => fetchResultingWarningId(id),
    enabled: p?.status === "Lolos",
  });

  const evidenceQ = useQuery({
    queryKey: ["proposal-evidence", id],
    queryFn: async () => {
      const [tasks, meetings, coachings] = await Promise.all([
        p?.linked_task_ids?.length
          ? db.from("tasks").select("id,title").in("id", p.linked_task_ids)
          : Promise.resolve({ data: [] }),
        p?.linked_meeting_ids?.length
          ? db.from("meetings").select("id,title,meeting_date").in("id", p.linked_meeting_ids)
          : Promise.resolve({ data: [] }),
        p?.linked_coaching_ids?.length
          ? db.from("coaching_notes").select("id,topic,created_at").in("id", p.linked_coaching_ids)
          : Promise.resolve({ data: [] }),
      ]);
      return {
        tasks: ((tasks as any).data ?? []) as { id: string; title: string }[],
        meetings: ((meetings as any).data ?? []) as {
          id: string;
          title: string;
          meeting_date: string | null;
        }[],
        coachings: ((coachings as any).data ?? []) as {
          id: string;
          topic: string;
          created_at: string;
        }[],
      };
    },
    enabled: !!p,
  });

  function fail(e: unknown) {
    toast.error(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
  }

  const responseMut = useMutation({
    mutationFn: (v: string) => submitTargetResponse(id, v),
    onSuccess: () => {
      toast.success("Sanggahan terkirim dan akan terbaca oleh pemilih.");
      qc.invalidateQueries({ queryKey: ["proposal", id] });
    },
    onError: fail,
  });

  const voteMut = useMutation({
    mutationFn: (choice: string) => castVote(id, profile!.id, choice),
    onSuccess: () => {
      toast.success("Suaramu tercatat. Terima kasih.");
      setPending(null);
      qc.invalidateQueries({ queryKey: ["proposal-voted", id] });
      qc.invalidateQueries({ queryKey: ["proposal-summary", id] });
    },
    onError: (e) => {
      setPending(null);
      fail(e);
    },
  });

  if (proposalQ.isLoading) return <p className="p-6 text-sm text-muted-foreground">Memuat…</p>;
  if (!p) return <p className="p-6 text-sm">Usulan tidak ditemukan.</p>;

  const { reason, cancelReason } = splitReason(p.reason);
  const isTarget = p.target_member_id === profile?.id;
  const eligible = isEligibleVoter(p, profile ?? null);
  const s = summaryQ.data;
  const ev = evidenceQ.data;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/warnings/proposals" className="text-sm text-muted-foreground hover:underline">
        ← Kembali ke daftar usulan
      </Link>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${PROPOSAL_STATUS_BADGE[p.status] ?? "bg-secondary"}`}
          >
            {PROPOSAL_STATUS_LABEL[p.status] ?? p.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${WARNING_LEVEL_BADGE[p.proposed_level] ?? "bg-secondary"}`}
          >
            {WARNING_LEVEL_LABEL[p.proposed_level] ?? p.proposed_level}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight">
          {p.target?.full_name ?? "—"}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({p.target?.role}
            {p.target?.division ? ` · ${p.target.division}` : ""})
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Diajukan oleh {p.proposer?.full_name ?? "—"} ({p.proposer?.role ?? "—"}) pada{" "}
          {new Date(p.created_at).toLocaleString("id-ID")}
        </p>
        <p className="text-sm text-muted-foreground">
          Ruang lingkup pemilih: {scopeLabel(p.voter_scope)}
        </p>
        {p.status === "Voting" && (
          <p className="mt-2 text-sm font-medium text-amber-700">
            {countdownText(p.voting_ends_at)}
          </p>
        )}
        {s && (
          <p className="mt-1 text-sm text-muted-foreground">
            {s.finished && s.agree !== null
              ? `Hasil akhir: ${s.agree} setuju, ${s.disagree} tidak setuju, ${s.abstain} abstain dari ${s.eligible} berhak`
              : `${s.votes_cast} dari ${s.eligible} berhak sudah memilih`}
          </p>
        )}
        {p.status === "Lolos" && resultingQ.data && (
          <Link to="/warnings" className="mt-2 inline-block text-sm font-medium underline">
            Lihat peringatan yang diterbitkan
          </Link>
        )}
        {cancelReason && (
          <p className="mt-3 rounded-xl bg-muted p-3 text-sm">
            <span className="font-semibold">Alasan pembatalan: </span>
            {cancelReason}
          </p>
        )}

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Alasan usulan
        </h2>
        <p className="mt-1 whitespace-pre-wrap text-sm">{reason}</p>

        <h2 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Bukti terlampir
        </h2>
        <ul className="mt-1 space-y-1 text-sm">
          {ev?.tasks.map((t) => (
            <li key={t.id}>
              <Link to="/workspace" className="underline">
                Task: {t.title}
              </Link>
            </li>
          ))}
          {ev?.meetings.map((m) => (
            <li key={m.id}>
              <Link to="/meetings/$id" params={{ id: m.id }} className="underline">
                Rapat: {m.title} {m.meeting_date ? `(${m.meeting_date.slice(0, 10)})` : ""}
              </Link>
            </li>
          ))}
          {ev?.coachings.map((c) => (
            <li key={c.id}>
              <Link to="/coaching" className="underline">
                Catatan bimbingan: {c.topic} ({c.created_at.slice(0, 10)})
              </Link>
            </li>
          ))}
          {ev && !ev.tasks.length && !ev.meetings.length && !ev.coachings.length && (
            <li className="text-muted-foreground">Tidak ada bukti yang bisa kamu buka.</li>
          )}
        </ul>
      </section>

      {p.target_response ? (
        <section className="rounded-2xl border border-sky-300 bg-sky-50 p-5">
          <h2 className="text-sm font-semibold text-sky-900">Sanggahan Sasaran</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-sky-950">{p.target_response}</p>
          {p.response_submitted_at && (
            <p className="mt-2 text-xs text-sky-800">
              Dikirim {new Date(p.response_submitted_at).toLocaleString("id-ID")}
            </p>
          )}
        </section>
      ) : (
        isTarget &&
        p.status === "Voting" && (
          <section className="rounded-2xl border-2 border-sky-400 bg-sky-50 p-5">
            <h2 className="text-sm font-semibold text-sky-900">Ruang Sanggahan</h2>
            <p className="mt-1 text-sm text-sky-900">
              Kamu berhak menulis sanggahan sebelum pemungutan suara berakhir. Sanggahan kamu akan
              ditampilkan berdampingan dengan usulan untuk semua pemilih.
            </p>
            <Textarea
              rows={5}
              className="mt-3 bg-background"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Tulis penjelasan atau klarifikasi kamu."
            />
            <Button
              className="mt-3"
              disabled={response.trim().length < 10 || responseMut.isPending}
              onClick={() => responseMut.mutate(response.trim())}
            >
              Kirim Sanggahan
            </Button>
          </section>
        )
      )}

      {p.status === "Voting" && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pemungutan Suara
          </h2>
          {!eligible ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Kamu bukan pemilih berhak untuk usulan ini.
            </p>
          ) : votedQ.data ? (
            <p className="mt-2 text-sm font-medium">Kamu sudah memilih.</p>
          ) : (
            <>
              <p className="mt-2 rounded-xl bg-muted p-3 text-sm">
                Suaramu anonim ke sesama dan sasaran. Hanya Supervisor yang bisa membuka isi suara
                untuk investigasi. Pilih dengan hati nurani berdasarkan bukti.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {CHOICES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPending(c.value)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${c.cls}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {pending && (
                <div className="mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
                  Kamu memilih: {CHOICES.find((c) => c.value === pending)?.label}. Setelah dikirim,
                  tidak bisa diubah. Lanjut?
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={voteMut.isPending}
                      onClick={() => voteMut.mutate(pending)}
                    >
                      Ya, kirim suara
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPending(null)}>
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
