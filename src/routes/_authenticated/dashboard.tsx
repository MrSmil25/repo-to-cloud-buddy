import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Boxes, UserCheck, Building2, BriefcaseBusiness, Handshake, Coins, Landmark, Receipt, CalendarDays } from "lucide-react";
import { useDivisions, useMyProfile, useProfiles, isSupervisor } from "@/hooks/useProfile";
import { fetchDeals } from "@/lib/deals";
import { fetchDashboardFinance } from "@/lib/transactions";
import { fetchEvents, formatEventDate } from "@/lib/events";
import { formatRupiah } from "@/lib/format";
import { canManageCash, fetchMyBills, fetchPendingClaims } from "@/lib/cash";
import { SupervisorOverview } from "@/components/assignments/SupervisorOverview";
import { UrgentBanners } from "@/components/announcements/UrgentBanners";
import { WelcomeGuideCard } from "@/components/WelcomeGuideCard";
import { countContributionsThisWeek, countUnacknowledgedCoaching, isKadiv } from "@/lib/hr";
import { countUnacknowledgedWarnings, fetchWarnings } from "@/lib/warnings";
import { fetchProposals, isEligibleVoter } from "@/lib/proposals";
import { isBPH } from "@/hooks/useProfile";
import { isBPHOrSupervisor } from "@/lib/hr";
import { fetchWallets } from "@/lib/finance-summary";
import { fetchCancelRequests } from "@/lib/cancel-requests";
import { fetchHelpRequests } from "@/lib/help-requests";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OrgTool" },
      { name: "description", content: "Ringkasan anggota dan divisi organisasi kampus." },
      { property: "og:title", content: "Dashboard — OrgTool" },
      { property: "og:description", content: "Ringkasan anggota dan divisi organisasi kampus." },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  valueClassName = "",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight break-words ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DashboardPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: divisions = [] } = useDivisions();

  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: fetchDeals });
  const { data: finance } = useQuery({ queryKey: ["dashboard-finance"], queryFn: fetchDashboardFinance });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const canSeeWealth = ["Controller", "Ketua", "Waketu", "Supervisor"].includes(
    profile?.role ?? "",
  );
  const { data: wallets } = useQuery({
    queryKey: ["fin-wallets"],
    queryFn: fetchWallets,
    enabled: canSeeWealth,
  });

  const cashManager = canManageCash(profile?.role);
  const { data: myBills = [] } = useQuery({ queryKey: ["my-bills"], queryFn: fetchMyBills });
  const { data: pendingClaims = [] } = useQuery({
    queryKey: ["cash-pending-claims"],
    queryFn: fetchPendingClaims,
    enabled: cashManager,
  });
  const unpaidBills = myBills.filter(
    (b) => b.status === "Belum_Bayar" || b.status === "Ditolak",
  ).length;

  const { data: unreadCoaching = 0 } = useQuery({
    queryKey: ["coaching-unread", profile?.id],
    queryFn: () => countUnacknowledgedCoaching(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: weeklyContributions = 0 } = useQuery({
    queryKey: ["contributions-week", profile?.id],
    queryFn: () => countContributionsThisWeek(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: unackWarnings = 0 } = useQuery({
    queryKey: ["warnings-unack", profile?.id],
    queryFn: () => countUnacknowledgedWarnings(profile!.id),
    enabled: !!profile?.id,
  });

  const kadiv = isKadiv(profile?.role);
  const { data: divisionWarnings = [] } = useQuery({
    queryKey: ["warnings", "division-active", profile?.division],
    queryFn: () => fetchWarnings({ activeOnly: true }),
    enabled: kadiv && !!profile?.division,
  });
  const divisionWarningCount = divisionWarnings.filter(
    (w) => w.member?.division === profile?.division,
  ).length;

  const { data: cancelRequests = [] } = useQuery({
    queryKey: ["cancel-requests"],
    queryFn: fetchCancelRequests,
    enabled: !!profile?.id,
  });
  const { data: helpRequests = [] } = useQuery({
    queryKey: ["help-requests"],
    queryFn: fetchHelpRequests,
    enabled: !!profile?.id,
  });
  const myPendingCancels = cancelRequests.filter(
    (r) => r.status === "Pending" && r.requested_by === profile?.id,
  ).length;
  const myPendingHelp = helpRequests.filter(
    (r) => r.status === "Pending" && r.requested_by === profile?.id,
  ).length;
  const decisionsWaiting =
    cancelRequests.filter((r) => r.status === "Pending" && r.requested_by !== profile?.id).length +
    helpRequests.filter(
      (r) =>
        r.status === "Pending" &&
        r.requested_by !== profile?.id &&
        r.target_division === profile?.division,
    ).length;

  const bphOrSupervisor = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);
  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    enabled: !!profile?.id,
  });
  const activeProposals = proposals.filter((p) => p.status === "Voting");
  const myVoteProposals = activeProposals.filter((p) =>
    isEligibleVoter(p, profile ? { id: profile.id, division: profile.division } : null),
  );
  const proposalsAboutMe = activeProposals.filter((p) => p.target_member_id === profile?.id);


  const activeEvents = events.filter((e) =>
    ["Planning", "Preparation", "Live"].includes(e.status ?? ""),
  );
  const myPicEvents = activeEvents.filter((e) => e.pic_id && e.pic_id === profile?.id);
  const upcomingEvent = [...events]
    .filter((e) => e.date_start && new Date(e.date_start).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.date_start!).getTime() - new Date(b.date_start!).getTime())[0];

  const activeDeals = deals.filter(
    (d) => d.stage !== "Deal" && d.stage !== "Rejected" && d.stage !== "Ghosted",
  ).length;
  const pipelineValue = deals
    .filter((d) => ["Prospect", "Contacted", "Pitched", "Negotiating"].includes(d.stage))
    .reduce((s, d) => s + Number(d.value_idr ?? 0), 0);

  const totalAnggota = profiles.length;
  const anggotaAktif = profiles.filter((p) => p.status === "Active").length;
  const myDivision = divisions.find((d) => d.code === profile?.division);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {unackWarnings > 0 && (
        <Link
          to="/warnings"
          className="block rounded-2xl border-2 border-red-400 bg-red-50 p-5 font-semibold text-red-900 shadow-sm transition-colors hover:bg-red-100"
        >
          Kamu punya {unackWarnings} peringatan yang perlu dibaca. Klik untuk membukanya.
        </Link>
      )}

      {proposalsAboutMe.map((p) => (
        <Link
          key={p.id}
          to="/warnings/proposals/$id"
          params={{ id: p.id }}
          className="block rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
        >
          Ada usulan peringatan untuk kamu. Kamu berhak menyanggah.
        </Link>
      ))}

      {canSeeWealth && (
        <Link
          to="/finance-summary"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Total Kekayaan</p>
          <p className="mt-1 text-3xl font-bold tracking-tight break-words">
            {wallets ? formatRupiah(wallets.total_saldo) : "…"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {wallets
              ? `Ops: ${formatRupiah(wallets.ops_saldo)} · Kas: ${formatRupiah(wallets.kas_saldo)}`
              : "Memuat ringkasan dompet…"}
          </p>
        </Link>
      )}

      {myPendingCancels > 0 && (
        <Link
          to="/workspace"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Permintaan batal task kamu ({myPendingCancels}) masih menunggu keputusan Kadiv.
        </Link>
      )}

      {myPendingHelp > 0 && (
        <Link
          to="/help-requests"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Request bantuan kamu ({myPendingHelp}) menunggu keputusan Kadiv divisi tujuan.
        </Link>
      )}

      {kadiv && decisionsWaiting > 0 && (
        <Link
          to="/help-requests"
          className="block rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
        >
          {decisionsWaiting} permintaan menunggu keputusanmu.
        </Link>
      )}

      <UrgentBanners />
      <WelcomeGuideCard />

      {myVoteProposals.length > 0 && (
        <Link
          to="/warnings/proposals"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Ada <span className="font-semibold">{myVoteProposals.length}</span> usulan peringatan
          menunggu suara kamu.
        </Link>
      )}

      {bphOrSupervisor && activeProposals.length > 0 && (
        <Link
          to="/warnings/proposals"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Usulan aktif di organisasi:{" "}
          <span className="font-semibold">{activeProposals.length}</span>
        </Link>
      )}

      {kadiv && divisionWarningCount > 0 && (
        <Link
          to="/warnings"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          SP aktif di divisi kamu:{" "}
          <span className="font-semibold">{divisionWarningCount}</span>
        </Link>
      )}

      {unpaidBills > 0 && (
        <Link
          to="/cash"
          className="block rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
        >
          Kamu punya {unpaidBills} tagihan kas belum dibayar. Klik untuk membayar.
        </Link>
      )}

      {cashManager && pendingClaims.length > 0 && (
        <Link
          to="/cash"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Klaim menunggu verifikasi: <span className="font-semibold">{pendingClaims.length}</span>
        </Link>
      )}

      {unreadCoaching > 0 && (
        <Link
          to="/coaching"
          className="block rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
        >
          Ada {unreadCoaching} catatan bimbingan yang belum kamu baca. Klik untuk membukanya.
        </Link>
      )}

      {weeklyContributions > 0 && (
        <Link
          to="/contributions"
          className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-sm transition-colors hover:bg-emerald-100"
        >
          Minggu ini kamu mendapat {weeklyContributions} apresiasi dari rekan. Terima kasih sudah
          hadir untuk tim.
        </Link>
      )}

      {isSupervisor(profile?.role) && <SupervisorOverview />}

      <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Halo, {profile?.nickname || profile?.full_name || "Anggota"}!
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80">
          Selamat datang kembali di OrgTool. Berikut ringkasan organisasi hari ini.
        </p>
        <Link
          to="/workspace"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-card/90"
        >
          <BriefcaseBusiness className="size-4" />
          Buka Ruang Kerja Saya
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Anggota" value={isLoading ? "…" : totalAnggota} icon={Users} />
        <StatCard label="Total Divisi" value={divisions.length || "…"} icon={Boxes} />
        <StatCard label="Anggota Aktif" value={isLoading ? "…" : anggotaAktif} icon={UserCheck} />
        <StatCard
          label="Divisi Saya"
          value={myDivision?.code ?? "-"}
          icon={Building2}
        />
        <StatCard label="Deal Aktif" value={activeDeals} icon={Handshake} />
        <StatCard label="Total Pipeline Value" value={formatRupiah(pipelineValue)} icon={Coins} />
        <StatCard
          label="Saldo Organisasi"
          value={finance ? formatRupiah(finance.balance) : "…"}
          icon={Landmark}
          valueClassName={finance ? (finance.balance >= 0 ? "text-emerald-600" : "text-red-600") : ""}
        />
        <StatCard
          label="Expense Bulan Ini"
          value={finance ? formatRupiah(finance.monthExpense) : "…"}
          icon={Receipt}
          valueClassName="text-red-600"
        />
        <StatCard label="Event Aktif" value={activeEvents.length} icon={CalendarDays} />

      </section>

      {myPicEvents.length > 0 && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Event yang Kamu PIC-in</h2>
          <ul className="mt-3 space-y-2">
            {myPicEvents.map((e) => (
              <li key={e.id}>
                <Link
                  to="/events/$id"
                  params={{ id: e.id }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="text-muted-foreground">
                    {formatEventDate(e.date_start, e.date_end)} · {e.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcomingEvent && (
        <Link
          to="/events/$id"
          params={{ id: upcomingEvent.id }}
          className="block rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Event Berikutnya</p>
          <h2 className="mt-1 text-lg font-semibold">{upcomingEvent.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatEventDate(upcomingEvent.date_start, upcomingEvent.date_end)}
            {upcomingEvent.venue ? ` — ${upcomingEvent.venue}` : ""}
          </p>
        </Link>
      )}

      {myDivision && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Divisi {myDivision.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {myDivision.description ?? "Belum ada deskripsi divisi."}
          </p>
        </section>
      )}
    </div>
  );
}
