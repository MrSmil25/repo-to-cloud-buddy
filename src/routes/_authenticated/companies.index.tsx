import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus } from "lucide-react";
import { fetchCompanies, STATUS_META, TYPE_META, COMPANY_TYPES, COMPANY_STATUSES } from "@/lib/companies";
import { useDivisions } from "@/hooks/useProfile";
import { CompanyFormDialog } from "@/components/companies/CompanyFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({
    meta: [
      { title: "Perusahaan — OrgTool" },
      { name: "description", content: "Basis data perusahaan mitra, sponsor, media, dan vendor organisasi." },
      { property: "og:title", content: "Perusahaan — OrgTool" },
      { property: "og:description", content: "Basis data perusahaan mitra, sponsor, media, dan vendor organisasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });
  const { data: divisions = [] } = useDivisions();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);

  const divisionName = (code: string | null) =>
    divisions.find((d) => d.code === code)?.name ?? null;

  const filtered = useMemo(
    () =>
      companies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.trim().toLowerCase()) &&
          (type === "all" || c.type === type) &&
          (status === "all" || c.overall_status === status),
      ),
    [companies, search, type, status],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perusahaan</h1>
          <p className="text-sm text-muted-foreground">
            {companies.length} perusahaan terdata di basis relasi eksternal.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Tambah Perusahaan
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama perusahaan…"
          className="sm:max-w-xs"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Semua tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            {COMPANY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{TYPE_META[t]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Semua status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {COMPANY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_META[s]?.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Kota</th>
              <th className="px-4 py-3">Divisi Pemilik</th>
              <th className="px-4 py-3">Terakhir Dihubungi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada perusahaan.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">
                  <Link to="/companies/$id" params={{ id: c.id }} className="text-primary hover:underline">
                    {c.name}
                  </Link>
                  {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TYPE_META[c.type]?.className ?? ""}`}>
                    {TYPE_META[c.type]?.label ?? c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_META[c.overall_status]?.className ?? ""}`}>
                    {STATUS_META[c.overall_status]?.label ?? c.overall_status}
                  </span>
                </td>
                <td className="px-4 py-3">{c.city ?? "—"}</td>
                <td className="px-4 py-3">{divisionName(c.owner_division) ?? "—"}</td>
                <td className="px-4 py-3">
                  {c.last_touch_date
                    ? format(new Date(c.last_touch_date), "d MMM yyyy", { locale: idLocale })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CompanyFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
