import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { DEAL_TYPE_LABELS, STAGE_META, fetchDealsByCompany } from "@/lib/deals";
import { formatDateID, formatRupiah } from "@/lib/format";
import { DealFormDialog } from "@/components/deals/DealFormDialog";
import { Button } from "@/components/ui/button";

export function CompanyDealsTab({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["company-deals", companyId],
    queryFn: () => fetchDealsByCompany(companyId),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Tambah Deal
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nama Deal</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Tahap</th>
              <th className="px-4 py-3">Nilai</th>
              <th className="px-4 py-3">Tenggat</th>
              <th className="px-4 py-3">Event</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {!isLoading && deals.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada deal.</td></tr>
            )}
            {deals.map((d) => (
              <tr key={d.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3">{DEAL_TYPE_LABELS[d.deal_type] ?? d.deal_type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_META[d.stage]?.badge ?? ""}`}>
                    {STAGE_META[d.stage]?.label ?? d.stage}
                  </span>
                </td>
                <td className="px-4 py-3">{formatRupiah(d.value_idr)}</td>
                <td className="px-4 py-3">{d.deadline ? formatDateID(d.deadline) : "—"}</td>
                <td className="px-4 py-3">{d.events?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DealFormDialog open={open} onOpenChange={setOpen} defaultCompanyId={companyId} />
    </div>
  );
}
