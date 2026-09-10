import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyProfile, useProfiles, isBPH } from "@/hooks/useProfile";
import {
  fetchHoldingDetail,
  isBPHOrSupervisor,
  reassignHoldings,
  type HoldingGroup,
  type HoldingItem,
} from "@/lib/hr";

export const Route = createFileRoute("/_authenticated/reports/holdings/$id")({
  head: () => ({
    meta: [
      { title: "Detail Serah Terima — OrgTool" },
      { name: "description", content: "Semua tanggung jawab yang dipegang seorang anggota." },
      { property: "og:title", content: "Detail Serah Terima — OrgTool" },
      {
        property: "og:description",
        content: "Semua tanggung jawab yang dipegang seorang anggota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HoldingDetailPage,
});

const GROUPS: { key: HoldingGroup; label: string; link?: (id: string) => React.ReactNode }[] = [
  { key: "tasks", label: "Task Aktif" },
  { key: "deals", label: "Deal Aktif" },
  { key: "keyResults", label: "Key Result" },
  { key: "events", label: "Event yang Di-PIC" },
  { key: "mous", label: "MoU" },
];

function HoldingDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const canReassign = isBPH(profile?.role) || isBPHOrSupervisor(profile?.role);

  const { data, isLoading } = useQuery({
    queryKey: ["holding-detail", id],
    queryFn: () => fetchHoldingDetail(id),
  });

  const [targets, setTargets] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: ({ group, ids, owner }: { group: HoldingGroup; ids: string[]; owner: string }) =>
      reassignHoldings(group, ids, owner),
    onSuccess: () => {
      toast.success("Tanggung jawab berhasil dialihkan.");
      queryClient.invalidateQueries({ queryKey: ["holding-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["member-holdings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal mengalihkan."),
  });

  const member = profiles.find((p) => p.id === id);
  const others = profiles.filter((p) => p.id !== id);

  function itemsOf(group: HoldingGroup): HoldingItem[] {
    if (!data) return [];
    return data[group];
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/reports/holdings" className="text-sm text-primary hover:underline">
          ← Kembali ke daftar
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Serah Terima — {member?.full_name ?? "Anggota"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Semua yang dipegang, per kategori, supaya tidak ada yang tertinggal.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}

      {GROUPS.map((g) => {
        const items = itemsOf(g.key);
        return (
          <section key={g.key} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {g.label}{" "}
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              {canReassign && items.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={targets[g.key] ?? ""}
                    onValueChange={(v) => setTargets((t) => ({ ...t, [g.key]: v }))}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Alihkan ke…" />
                    </SelectTrigger>
                    <SelectContent>
                      {others.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!targets[g.key] || mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        group: g.key,
                        ids: items.map((i) => i.id),
                        owner: targets[g.key] as string,
                      })
                    }
                  >
                    Alihkan semua
                  </Button>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Tidak ada.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm"
                  >
                    <span className="font-medium">
                      {g.key === "events" ? (
                        <Link
                          to="/events/$id"
                          params={{ id: item.id }}
                          className="text-primary hover:underline"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        item.label
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.sub}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
