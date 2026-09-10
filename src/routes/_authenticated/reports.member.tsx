import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchWarnings,
  WARNING_LEVEL_BADGE,
  WARNING_LEVEL_LABEL,
  WARNING_STATUS_BADGE,
} from "@/lib/warnings";
import { UserAvatar } from "@/components/UserAvatar";
import { useMyProfile, useProfiles, isBPH } from "@/hooks/useProfile";
import {
  fetchCoachingNotes,
  fetchContributions,
  fetchMemberReport,
  isBPHOrSupervisor,
  isKadiv,
  rateColor,
  rateLabel,
  COACHING_TOPIC_LABEL,
  CONTRIBUTION_KIND_LABEL,
} from "@/lib/hr";
import { formatDateID, formatRupiah } from "@/lib/format";
import {
  PaymentHistoryDialog,
  formatDateTimeIndo,
} from "@/components/cash/PaymentHistoryDialog";
import {
  KIND_META,
  PAYMENT_STATUS_META,
  fetchMemberBills,
  type CollectionPayment,
} from "@/lib/cash";

export const Route = createFileRoute("/_authenticated/reports/member")({
  head: () => ({
    meta: [
      { title: "Rapor Anggota — OrgTool" },
      { name: "description", content: "Ringkasan kinerja anggota dalam satu periode." },
      { property: "og:title", content: "Rapor Anggota — OrgTool" },
      { property: "og:description", content: "Ringkasan kinerja anggota dalam satu periode." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberReportPage,
});

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function RateBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {v}% · {rateLabel(v)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${rateColor(v)}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function MemberReportPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();

  const bph = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);
  const kadiv = isKadiv(profile?.role);

  const candidates = useMemo(() => {
    if (!profile) return [];
    if (bph) return profiles;
    if (kadiv) return profiles.filter((p) => p.division === profile.division);
    return profiles.filter((p) => p.id === profile.id);
  }, [profiles, profile, bph, kadiv]);

  const [member, setMember] = useState<string>("");
  const [start, setStart] = useState(isoDaysAgo(90));
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState<{ member: string; start: string; end: string } | null>(null);

  const selected = member || profile?.id || "";

  const report = useQuery({
    queryKey: ["member-report", query],
    queryFn: () => fetchMemberReport(query!.member, query!.start, query!.end),
    enabled: !!query,
  });

  const coaching = useQuery({
    queryKey: ["coaching-notes", "member", query?.member],
    queryFn: () => fetchCoachingNotes({ memberId: query!.member }),
    enabled: !!query,
  });

  const contributions = useQuery({
    queryKey: ["contribution-notes", "member", query?.member],
    queryFn: () => fetchContributions({ memberId: query!.member }),
    enabled: !!query,
  });

  const [billHistory, setBillHistory] = useState<CollectionPayment | null>(null);

  const memberBills = useQuery({
    queryKey: ["member-cash-bills", query?.member],
    queryFn: () => fetchMemberBills(query!.member),
    enabled: !!query,
  });

  const memberWarnings = useQuery({
    queryKey: ["warnings", "member", query?.member],
    queryFn: () => fetchWarnings({ memberId: query!.member }),
    enabled: !!query,
  });

  const memberProfile = profiles.find((p) => p.id === (query?.member ?? selected));
  const r = report.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rapor Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Angka apa adanya untuk bahan diskusi. Penilaian tetap dilakukan manusia.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Dari tanggal</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Sampai tanggal</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Anggota</Label>
          <Select
            value={selected}
            onValueChange={setMember}
            disabled={candidates.length <= 1}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih anggota" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => {
              if (!selected) {
                toast.error("Pilih anggota terlebih dahulu.");
                return;
              }
              setQuery({ member: selected, start, end });
            }}
          >
            Lihat Rapor
          </Button>
        </div>
      </section>

      {report.isLoading && <p className="text-sm text-muted-foreground">Menyusun rapor…</p>}
      {report.isError && (
        <p className="text-sm text-red-600">
          Rapor ini tidak bisa dibuka dengan akses Anda saat ini.
        </p>
      )}

      {r && (
        <>
          <section className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <UserAvatar
              path={memberProfile?.photo_url}
              name={r.full_name}
              className="size-14"
            />
            <div>
              <h2 className="text-lg font-semibold">{r.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {r.division ?? "Tanpa divisi"} · {r.role}
              </p>
              <p className="text-xs text-muted-foreground">
                Periode {formatDateID(query!.start)} – {formatDateID(query!.end)}
              </p>
            </div>
          </section>

          <Tabs defaultValue="metrik">
            <TabsList>
              <TabsTrigger value="metrik">Metrik</TabsTrigger>
              <TabsTrigger value="bimbingan">Catatan Bimbingan</TabsTrigger>
              <TabsTrigger value="kontribusi">Catatan Kontribusi</TabsTrigger>
              <TabsTrigger value="peringatan">Riwayat Peringatan</TabsTrigger>
              <TabsTrigger value="kas">Riwayat Kas</TabsTrigger>
            </TabsList>

            <TabsContent value="kas" className="mt-4">
              {memberBills.isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat…</p>
              ) : (memberBills.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada tagihan kas untuk anggota ini.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Program</th>
                        <th className="px-4 py-2 font-semibold">Jenis</th>
                        <th className="px-4 py-2 font-semibold">Nominal</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                        <th className="px-4 py-2 font-semibold">Diklaim</th>
                        <th className="px-4 py-2 font-semibold">Diverifikasi</th>
                        <th className="px-4 py-2 font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(memberBills.data ?? []).map((b) => {
                        const st =
                          PAYMENT_STATUS_META[b.status] ?? PAYMENT_STATUS_META['Belum_Bayar']!;
                        const kind = KIND_META[b.collections?.kind ?? "Kas_Rutin"] ?? KIND_META['Kas_Rutin']!;
                        return (
                          <tr key={b.id}>
                            <td className="px-4 py-2">{b.collections?.title ?? "-"}</td>
                            <td className="px-4 py-2">{kind.label}</td>
                            <td className="px-4 py-2">
                              {formatRupiah(b.amount_paid ?? b.collections?.amount_per_person ?? 0)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.className}`}
                              >
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-2">{formatDateTimeIndo(b.claimed_at)}</td>
                            <td className="px-4 py-2">{formatDateTimeIndo(b.verified_at)}</td>
                            <td className="px-4 py-2">
                              {b.status === "Lunas" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setBillHistory(b)}
                                >
                                  Lihat Bukti
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <PaymentHistoryDialog
                    payment={billHistory}
                    memberName={r.full_name}
                    onClose={() => setBillHistory(null)}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrik" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Panel title="Task">
                  <Metric label="Total" value={r.tasks_total} />
                  <Metric label="Selesai" value={r.tasks_done} />
                  <Metric label="Tertunggak" value={r.tasks_overdue} />
                  <Metric label="Terhambat" value={r.tasks_blocked} />
                  <Metric label="Rata-rata keterlambatan" value={`${r.avg_days_late} hari`} />
                  <RateBar label="Tingkat penyelesaian" value={r.completion_rate} />
                </Panel>

                <Panel title="Rapat">
                  <Metric label="Total diundang" value={r.meetings_total} />
                  <Metric label="Hadir" value={r.meetings_hadir} />
                  <Metric label="Alpa" value={r.meetings_alpa} />
                  <RateBar label="Kehadiran" value={r.attendance_rate} />
                </Panel>

                <Panel title="Tugas Pembina">
                  <Metric label="Total" value={r.assignments_total} />
                  <Metric label="Sudah dikumpulkan" value={r.assignments_submitted} />
                  <RateBar label="Pengumpulan" value={r.submission_rate} />
                </Panel>

                <Panel title="Kas">
                  <Metric label="Total tagihan" value={r.kas_total} />
                  <Metric label="Lunas" value={r.kas_lunas} />
                  <RateBar label="Pelunasan" value={r.kas_rate} />
                </Panel>

                <Panel title="Key Result">
                  <Metric label="Ditanggung" value={r.kr_owned} />
                  <RateBar label="Rata-rata progres" value={r.kr_avg_progress} />
                </Panel>

                <Panel title="Deal">
                  <Metric label="Dipegang" value={r.deals_owned} />
                  <Metric label="Closed" value={r.deals_closed} />
                  <Metric label="Total nilai" value={formatRupiah(r.deals_value)} />
                </Panel>
              </div>
            </TabsContent>

            <TabsContent value="bimbingan" className="mt-4 space-y-3">
              {(coaching.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada catatan bimbingan yang bisa ditampilkan.
                </p>
              ) : (
                (coaching.data ?? []).map((n) => (
                  <article key={n.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">
                        {COACHING_TOPIC_LABEL[n.topic] ?? n.topic}
                      </span>
                      <span className="text-muted-foreground">{formatDateID(n.created_at)}</span>
                      <span className="text-muted-foreground">
                        oleh {n.coach?.full_name ?? "—"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{n.discussion}</p>
                    {n.agreements && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        Kesepakatan: {n.agreements}
                      </p>
                    )}
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="kontribusi" className="mt-4 space-y-3">
              {(contributions.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada catatan kontribusi yang bisa ditampilkan.
                </p>
              ) : (
                (contributions.data ?? []).map((c) => (
                  <article key={c.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                        {CONTRIBUTION_KIND_LABEL[c.kind] ?? c.kind}
                      </span>
                      <span className="text-muted-foreground">{formatDateID(c.created_at)}</span>
                      <span className="text-muted-foreground">
                        dicatat oleh {c.recorder?.full_name ?? "—"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p>
                  </article>
                ))
              )}
            </TabsContent>

            <TabsContent value="peringatan" className="mt-4 space-y-3">
              {memberWarnings.isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat…</p>
              ) : (memberWarnings.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada catatan peringatan untuk anggota ini.
                </p>
              ) : (
                (memberWarnings.data ?? []).map((w) => (
                  <article key={w.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${WARNING_LEVEL_BADGE[w.level] ?? "bg-secondary"}`}
                      >
                        {WARNING_LEVEL_LABEL[w.level] ?? w.level}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${WARNING_STATUS_BADGE[w.status] ?? "bg-secondary"}`}
                      >
                        {w.status}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDateID(w.issued_at ?? w.created_at)}
                      </span>
                      <span className="text-muted-foreground">
                        diterbitkan oleh {w.issuer?.full_name ?? "—"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{w.reason}</p>
                    {w.member_response && (
                      <div className="mt-2 rounded-xl border bg-muted/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tanggapan anggota
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{w.member_response}</p>
                      </div>
                    )}
                  </article>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
