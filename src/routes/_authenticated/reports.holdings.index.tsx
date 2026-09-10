import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchHoldings } from "@/lib/hr";

export const Route = createFileRoute("/_authenticated/reports/holdings/")({
  head: () => ({
    meta: [
      { title: "Serah Terima — OrgTool" },
      { name: "description", content: "Apa saja yang dipegang tiap anggota sebelum dialihkan." },
      { property: "og:title", content: "Serah Terima — OrgTool" },
      {
        property: "og:description",
        content: "Apa saja yang dipegang tiap anggota sebelum dialihkan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HoldingsPage,
});

function HoldingsPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["member-holdings"],
    queryFn: fetchHoldings,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Serah Terima</h1>
        <p className="text-sm text-muted-foreground">
          Sebelum memindahkan atau melepas seseorang, pastikan tanggung jawabnya dialihkan dengan
          sadar.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Divisi</th>
              <th className="px-4 py-3 font-semibold">Task</th>
              <th className="px-4 py-3 font-semibold">Deal</th>
              <th className="px-4 py-3 font-semibold">KR</th>
              <th className="px-4 py-3 font-semibold">Event PIC</th>
              <th className="px-4 py-3 font-semibold">Divisi Dipimpin</th>
              <th className="px-4 py-3 font-semibold">MoU</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-muted-foreground">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.member_id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.full_name}</td>
                  <td className="px-4 py-3">{r.division ?? "-"}</td>
                  <td className="px-4 py-3">{Number(r.task_aktif ?? 0)}</td>
                  <td className="px-4 py-3">{Number(r.deal_aktif ?? 0)}</td>
                  <td className="px-4 py-3">{Number(r.kr_ditanggung ?? 0)}</td>
                  <td className="px-4 py-3">{Number(r.event_dipic ?? 0)}</td>
                  <td className="px-4 py-3">{Number(r.divisi_dipimpin ?? 0)}</td>
                  <td className="px-4 py-3">{Number(r.mou_ditandatangani ?? 0)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/reports/holdings/$id"
                      params={{ id: r.member_id }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Lihat detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
