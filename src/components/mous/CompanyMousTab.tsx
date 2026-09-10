import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { formatDateID } from "@/lib/format";
import { MOU_STATUS_META, fetchMousByCompany, type MouWithRelations } from "@/lib/mous";
import { MouFormDialog } from "@/components/mous/MouFormDialog";
import { MouDetailDialog } from "@/components/mous/MouDetailDialog";
import { Button } from "@/components/ui/button";

export function CompanyMousTab({ companyId }: { companyId: string }) {
  const { data: mous = [], isLoading } = useQuery({
    queryKey: ["company-mous", companyId],
    queryFn: () => fetchMousByCompany(companyId),
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MouWithRelations | null>(null);
  const [detail, setDetail] = useState<MouWithRelations | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah MoU
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Judul</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ditandatangani</th>
              <th className="px-4 py-3">Expired</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {!isLoading && mous.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada MoU.</td></tr>
            )}
            {mous.map((m) => {
              const meta = MOU_STATUS_META[m.status];
              return (
                <tr key={m.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(m)}>
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta?.className ?? ""}`}>
                      {meta?.label ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateID(m.signed_date)}</td>
                  <td className="px-4 py-3">{formatDateID(m.expiry_date)}</td>
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
      <MouFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mou={editing}
        defaultCompanyId={companyId}
      />
    </div>
  );
}
