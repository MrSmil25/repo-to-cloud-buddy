import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDivisions, useMyProfile, isBPH } from "@/hooks/useProfile";
import { fetchWorkload, isBPHOrSupervisor, isKadiv } from "@/lib/hr";

export const Route = createFileRoute("/_authenticated/reports/workload")({
  head: () => ({
    meta: [
      { title: "Peta Beban Kerja — OrgTool" },
      { name: "description", content: "Sebaran beban task antar anggota agar pembagian adil." },
      { property: "og:title", content: "Peta Beban Kerja — OrgTool" },
      {
        property: "og:description",
        content: "Sebaran beban task antar anggota agar pembagian adil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkloadPage,
});

function Insight({ text }: { text: string }) {
  return <li className="rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">{text}</li>;
}

function WorkloadPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["workload-distribution"],
    queryFn: fetchWorkload,
  });

  const bph = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);
  const kadiv = isKadiv(profile?.role);
  const [division, setDivision] = useState<string>("all");

  const effectiveDivision = kadiv && !bph ? (profile?.division ?? "all") : division;

  const filtered = useMemo(() => {
    const base =
      effectiveDivision === "all"
        ? rows
        : rows.filter((r) => r.division === effectiveDivision);
    return [...base].sort((a, b) => Number(b.beban_aktif ?? 0) - Number(a.beban_aktif ?? 0));
  }, [rows, effectiveDivision]);

  const values = filtered.map((r) => Number(r.beban_aktif ?? 0));
  const max = Math.max(1, ...values);
  const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const highest = filtered[0];
  const lowest = filtered[filtered.length - 1];

  function barColor(value: number) {
    if (value > avg * 1.3) return "bg-orange-500";
    if (value < avg * 0.7) return "bg-sky-300";
    return "bg-emerald-500";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Peta Beban Kerja</h1>
        <p className="text-sm text-muted-foreground">
          Lihat dulu apakah pembagian tugas sudah adil sebelum menilai orang.
        </p>
      </header>

      {bph && (
        <div className="max-w-xs space-y-1.5">
          <Label>Divisi</Label>
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua divisi</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {!bph && kadiv && (
        <p className="text-sm text-muted-foreground">
          Menampilkan divisi {profile?.division ?? "-"}.
        </p>
      )}

      <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data beban kerja.</p>
        ) : (
          filtered.map((r) => {
            const v = Number(r.beban_aktif ?? 0);
            return (
              <div key={r.member_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {r.full_name}
                    <span className="ml-2 text-xs text-muted-foreground">{r.division ?? "-"}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {v} task aktif · {Number(r.tunggakan ?? 0)} tunggakan ·{" "}
                    {Number(r.macet ?? 0)} macet
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${barColor(v)}`}
                    style={{ width: `${Math.max(4, (v / max) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>

      {filtered.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          <Insight text={`Rata-rata beban: ${avg.toFixed(1)} task/orang`} />
          {highest && (
            <Insight
              text={`Beban tertinggi: ${highest.full_name} (${Number(highest.beban_aktif ?? 0)} task)`}
            />
          )}
          {lowest && (
            <Insight
              text={`Beban terendah: ${lowest.full_name} (${Number(lowest.beban_aktif ?? 0)} task)`}
            />
          )}
          {highest && lowest && highest.member_id !== lowest.member_id && (
            <Insight
              text={`Selisih terjauh: ${
                Number(highest.beban_aktif ?? 0) - Number(lowest.beban_aktif ?? 0)
              } task antara ${highest.full_name} dan ${lowest.full_name}`}
            />
          )}
        </ul>
      )}
    </div>
  );
}
