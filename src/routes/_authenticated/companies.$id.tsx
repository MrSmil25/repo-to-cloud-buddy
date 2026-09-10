import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CONTACT_CHANNEL_LABELS,
  CONTACT_ROLE_LABELS,
  STATUS_META,
  TYPE_META,
  deletePerson,
  fetchCompany,
  fetchPeople,
  type Person,
} from "@/lib/companies";
import { CompanyFormDialog } from "@/components/companies/CompanyFormDialog";
import { ContactFormDialog } from "@/components/companies/ContactFormDialog";
import { CompanyDealsTab } from "@/components/deals/CompanyDealsTab";
import { CompanyMousTab } from "@/components/mous/CompanyMousTab";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: () => ({
    meta: [
      { title: "Detail Perusahaan — OrgTool" },
      { name: "description", content: "Profil perusahaan mitra beserta daftar kontak person yang terhubung." },
      { property: "og:title", content: "Detail Perusahaan — OrgTool" },
      { property: "og:description", content: "Profil perusahaan mitra beserta daftar kontak person yang terhubung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: () => fetchCompany(id),
  });
  const { data: people = [] } = useQuery({
    queryKey: ["company-people", id],
    queryFn: () => fetchPeople(id),
  });
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  async function removePerson(person: Person) {
    if (!window.confirm(`Hapus kontak ${person.full_name}?`)) return;
    try {
      await deletePerson(person.id);
      await queryClient.invalidateQueries({ queryKey: ["company-people", id] });
      toast.success("Kontak dihapus");
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!company)
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Perusahaan tidak ditemukan atau tidak dapat diakses.</p>
        <Link to="/companies" className="text-sm text-primary hover:underline">Kembali ke daftar</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke daftar perusahaan
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${TYPE_META[company.type]?.className ?? ""}`}>
              {TYPE_META[company.type]?.label ?? company.type}
            </span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_META[company.overall_status]?.className ?? ""}`}>
              {STATUS_META[company.overall_status]?.label ?? company.overall_status}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {company.industry && <span>{company.industry} · </span>}
            {company.city && <span>{company.city} · </span>}
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {company.website}
              </a>
            ) : null}
          </div>
          {company.last_touch_date && (
            <p className="text-xs text-muted-foreground">
              Terakhir dihubungi{" "}
              {format(new Date(company.last_touch_date), "d MMMM yyyy", { locale: idLocale })}
            </p>
          )}
          {company.notes && <p className="max-w-xl text-sm">{company.notes}</p>}
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="kontak">
        <TabsList>
          <TabsTrigger value="kontak">Kontak</TabsTrigger>
          <TabsTrigger value="deal">Deal</TabsTrigger>
          <TabsTrigger value="mou">MoU</TabsTrigger>
        </TabsList>

        <TabsContent value="kontak" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingPerson(null);
                setContactOpen(true);
              }}
            >
              <Plus className="size-4" /> Tambah Kontak
            </Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Jabatan</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Telepon</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {people.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada kontak.</td></tr>
                )}
                {people.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {p.full_name}
                      {p.linkedin_url && (
                        <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline">
                          LinkedIn
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.title ?? "—"}</td>
                    <td className="px-4 py-3">{p.email ?? "—"}</td>
                    <td className="px-4 py-3">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.role_in_relation ? CONTACT_ROLE_LABELS[p.role_in_relation] : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.preferred_channel ? CONTACT_CHANNEL_LABELS[p.preferred_channel] : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPerson(p);
                            setContactOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removePerson(p)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="deal">
          <CompanyDealsTab companyId={id} />
        </TabsContent>
        <TabsContent value="mou">
          <CompanyMousTab companyId={id} />
        </TabsContent>

      </Tabs>

      <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        companyId={id}
        person={editingPerson}
      />
    </div>
  );
}
