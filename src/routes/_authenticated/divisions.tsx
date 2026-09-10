import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDivisions, useProfiles } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { DivisionBadge } from "@/components/DivisionBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/divisions")({
  head: () => ({
    meta: [
      { title: "Divisi — OrgTool" },
      { name: "description", content: "Daftar divisi organisasi kampus dan jumlah anggotanya." },
      { property: "og:title", content: "Divisi — OrgTool" },
      {
        property: "og:description",
        content: "Daftar divisi organisasi kampus dan jumlah anggotanya.",
      },
    ],
  }),
  component: DivisionsPage,
});

function DivisionsPage() {
  const { data: divisions = [], isLoading } = useDivisions();
  const { data: profiles = [] } = useProfiles();
  const [selected, setSelected] = useState<string | null>(null);

  const active = divisions.find((d) => d.code === selected);
  const members = profiles.filter((p) => p.division === selected);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Divisi</h1>
        <p className="text-sm text-muted-foreground">
          Klik kartu divisi untuk melihat daftar anggotanya.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat divisi…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {divisions.map((d) => {
          const count = profiles.filter((p) => p.division === d.code).length;
          const color = d.color_hex || "#1E3A8A";
          return (
            <button
              key={d.code}
              onClick={() => setSelected(d.code)}
              className="group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{d.name}</h2>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    {d.code}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {d.description ?? "Belum ada deskripsi."}
                </p>
                <p className="pt-1 text-sm font-medium">{count} anggota</p>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anggota {active?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada anggota di divisi ini.</p>
            )}
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <UserAvatar path={m.photo_url} name={m.full_name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <DivisionBadge name={active?.name} colorHex={active?.color_hex} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
