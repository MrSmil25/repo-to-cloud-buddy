import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { isBPH, useDivisions, useMyProfile } from "@/hooks/useProfile";
import { fetchMemberProgress, type MemberProgress } from "@/lib/workspace";
import { MemberProgressCard } from "@/components/member-progress/MemberProgressCard";

export const Route = createFileRoute("/_authenticated/member-progress")({
  head: () => ({
    meta: [
      { title: "Progres Anggota — OrgTool" },
      {
        name: "description",
        content: "Rapor kinerja anggota: task, deal, dan Key Result per orang.",
      },
      { property: "og:title", content: "Progres Anggota — OrgTool" },
      {
        property: "og:description",
        content: "Rapor kinerja anggota: task, deal, dan Key Result per orang.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberProgressPage,
});

const ALL = "__all__";

function MemberProgressPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["member-progress"],
    queryFn: fetchMemberProgress,
  });

  const bph = isBPH(profile?.role);
  const isKadiv = profile?.role === "Kadiv";
  const canSeeOthers = bph || isKadiv || profile?.role === "Sekretaris" || profile?.role === "Controller";

  const [division, setDivision] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const effectiveDivision = isKadiv ? (profile?.division ?? ALL) : division;

  const visible = useMemo(() => {
    let list: MemberProgress[] = rows;
    if (!canSeeOthers) {
      list = list.filter((r) => r.member_id === profile?.id);
    } else if (effectiveDivision !== ALL) {
      list = list.filter((r) => r.division === effectiveDivision);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          (r.nickname ?? "").toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) =>
        Number(b.tasks_overdue ?? 0) - Number(a.tasks_overdue ?? 0) ||
        a.full_name.localeCompare(b.full_name),
    );
  }, [rows, canSeeOthers, effectiveDivision, search, profile?.id]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Progres Anggota</h1>
        <p className="text-sm text-muted-foreground">
          {canSeeOthers
            ? "Angka di sini tidak pernah memuat task privat siapa pun."
            : "Rapor pribadi Anda. Task privat Anda tidak dihitung di sini."}
        </p>
      </header>

      {canSeeOthers && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="min-w-[180px] flex-1">
            <Input
              placeholder="Cari nama anggota…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!isKadiv && (
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Semua divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua divisi</SelectItem>
                {divisions.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isKadiv && (
            <p className="text-sm text-muted-foreground">
              Divisi: <span className="font-semibold">{profile?.division ?? "-"}</span>
            </p>
          )}
        </section>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Belum ada data progres yang bisa ditampilkan.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visible.map((m) => {
            const div = divisions.find((d) => d.code === m.division);
            return (
              <MemberProgressCard
                key={m.member_id}
                member={m}
                divisionName={div?.name}
                divisionColor={div?.color_hex}
                expanded={expanded === m.member_id}
                onToggle={() => setExpanded((v) => (v === m.member_id ? null : m.member_id))}
              />
            );
          })}
        </div>
      )}

      <section className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground shadow-sm">
        <p className="font-semibold text-foreground">Keterangan indikator</p>
        <p className="mt-1">
          🟢 Produktif: tidak ada task nunggak dan progress KR ≥60%. 🟡 Perlu Perhatian: 1–2 task
          nunggak atau progress KR 30–59%. 🔴 Tertinggal: ≥3 task nunggak atau progress KR &lt;30%.
          ⚪ Belum Ada Beban: belum ada task, deal, maupun KR.
        </p>
      </section>
    </div>
  );
}
