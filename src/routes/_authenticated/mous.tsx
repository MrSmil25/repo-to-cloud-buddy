import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { formatDateID } from "@/lib/format";
import {
  MOU_STATUSES,
  MOU_STATUS_META,
  daysLeft,
  daysLeftClassName,
  daysLeftLabel,
  fetchMous,
  type MouWithRelations,
} from "@/lib/mous";
import { MouFormDialog } from "@/components/mous/MouFormDialog";
import { MouDetailDialog } from "@/components/mous/MouDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/mous")({
  head: () => ({
    meta: [
      { title: "MoU — OrgTool" },
      { name: "description", content: "Daftar nota kesepahaman (MoU) beserta status, masa berlaku, dan dokumennya." },
      { property: "og:title", content: "MoU — OrgTool" },
      { property: "og:description", content: "Daftar nota kesepahaman (MoU) beserta status, masa berlaku, dan dokumennya." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MousPage,
});

function MousPage() {
  const { data: mous = [], isLoading } = useQuery({ queryKey: ["mous"], queryFn: fetchMous });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<MouWithRelations | null>(null);
  const [editing, setEditing] = useState<MouWithRelations | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mous.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.companies?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [mous, search, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MoU</h1>
          <p className="text-sm text-muted-foreground">Nota kesepahaman dengan mitra eksternal.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah MoU
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari judul atau perusahaan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {MOU_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{MOU_STATUS_META[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Perusahaan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ditandatangani</th>
              <th className="px-4 py-3">Expired</th>
              <th className="px-4 py-3">Sisa Hari</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada MoU.</td></tr>
            )}
            {rows.map((m) => {
              const left = daysLeft(m.expiry_date);
              const meta = MOU_STATUS_META[m.status];
              return (
                <tr
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetail(m)}
                >
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3">{m.companies?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta?.className ?? ""}`}>
                      {meta?.label ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateID(m.signed_date)}</td>
                  <td className="px-4 py-3">{formatDateID(m.expiry_date)}</td>
                  <td className={`px-4 py-3 ${daysLeftClassName(left)}`}>{daysLeftLabel(left)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MouDetailDialog
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        mou={detail}
        onEdit={() => {
          setEditing(detail);
          setDetail(null);
          setFormOpen(true);
        }}
      />
      <MouFormDialog open={formOpen} onOpenChange={setFormOpen} mou={editing} />
    </div>
  );
}
