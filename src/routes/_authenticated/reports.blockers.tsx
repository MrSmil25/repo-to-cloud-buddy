import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBlockedTasksBy, fetchBlockers } from "@/lib/hr";
import { formatDateID } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports/blockers")({
  head: () => ({
    meta: [
      { title: "Pelacak Penyumbat — OrgTool" },
      { name: "description", content: "Daftar hambatan yang membuat task berhenti berjalan." },
      { property: "og:title", content: "Pelacak Penyumbat — OrgTool" },
      {
        property: "og:description",
        content: "Daftar hambatan yang membuat task berhenti berjalan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlockersPage,
});

function BlockersPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["blocker-summary"],
    queryFn: fetchBlockers,
  });
  const [selected, setSelected] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["blocked-tasks", selected],
    queryFn: () => fetchBlockedTasksBy(selected as string),
    enabled: !!selected,
  });

  const selectedRow = rows.find((r) => r.penyumbat_id === selected);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pelacak Penyumbat</h1>
        <p className="text-sm text-muted-foreground">
          Tujuannya membuka hambatan, bukan mencari siapa yang salah.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Penyumbat</th>
              <th className="px-4 py-3 font-semibold">Task Macet</th>
              <th className="px-4 py-3 font-semibold">Macet Sejak</th>
              <th className="px-4 py-3 font-semibold">Hari Terlama</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                  Tidak ada task yang sedang tersumbat. Bagus!
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.penyumbat_id}
                  onClick={() =>
                    setSelected((s) => (s === r.penyumbat_id ? null : r.penyumbat_id))
                  }
                  className={`cursor-pointer border-t transition-colors hover:bg-accent/40 ${
                    selected === r.penyumbat_id ? "bg-accent/40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{r.penyumbat_nama}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {r.penyumbat_divisi ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{Number(r.jumlah_task_macet ?? 0)}</td>
                  <td className="px-4 py-3">{formatDateID(r.macet_sejak_terlama)}</td>
                  <td className="px-4 py-3">{Number(r.hari_terlama ?? 0)} hari</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Task yang menunggu {selectedRow?.penyumbat_nama ?? "orang ini"}
          </h2>
          {detail.isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : (detail.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada detail yang bisa ditampilkan.</p>
          ) : (
            <ul className="space-y-2">
              {(detail.data ?? []).map((t) => (
                <li key={t.id} className="rounded-xl border px-4 py-3 text-sm">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Dikerjakan oleh {t.assignee?.full_name ?? "—"} · macet sejak{" "}
                    {formatDateID(t.blocked_since)}
                  </p>
                  {t.blocked_reason && <p className="mt-1 text-sm">{t.blocked_reason}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
