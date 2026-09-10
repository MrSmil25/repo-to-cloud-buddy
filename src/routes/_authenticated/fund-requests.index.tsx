import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FundRequestFormDialog } from "@/components/fund-requests/FundRequestFormDialog";
import { ReimbursementFormDialog } from "@/components/fund-requests/ReimbursementFormDialog";
import { formatRupiah, formatDateID, relativeTime } from "@/lib/format";
import { fetchEventOptions } from "@/lib/deals";
import { useProfiles } from "@/hooks/useProfile";
import {
  fetchFundRequests,
  createFundRequest,
  createReimbursement,
  kindMeta,
  STATUS_CLASS,
  STATUS_LABEL,
  type NewFundRequest,
  type NewReimbursement,
} from "@/lib/fund-requests";

export const Route = createFileRoute("/_authenticated/fund-requests/")({
  head: () => ({
    meta: [
      { title: "Pengajuan Dana & Reimbursement | OrgTool" },
      {
        name: "description",
        content:
          "Ajukan dana sebelum belanja atau minta reimbursement atas pengeluaran yang sudah ditalangi, lengkap dengan status persetujuan.",
      },
      { property: "og:title", content: "Pengajuan Dana & Reimbursement" },
      {
        property: "og:description",
        content: "Kelola pengajuan dana dan reimbursement anggota organisasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FundRequestsPage,
});

type Filter = "Semua" | "Pengajuan" | "Reimbursement";

function FundRequestsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("Semua");
  const [openPengajuan, setOpenPengajuan] = useState(false);
  const [openReimbursement, setOpenReimbursement] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["fund-requests"],
    queryFn: fetchFundRequests,
  });
  const { data: profiles } = useProfiles();
  const { data: eventOptions } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });
  const eventNameOf = useMemo(() => {
    const map = new Map((eventOptions ?? []).map((e) => [e.id, e.name]));
    return (id: string) => map.get(id) ?? "Event";
  }, [eventOptions]);
  const nameOf = useMemo(() => {
    const map = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return (id: string) => map.get(id) ?? "Anggota";
  }, [profiles]);

  const rows = (requests ?? []).filter((r) =>
    filter === "Semua" ? true : (r.request_kind ?? "Pengajuan") === filter,
  );

  const createPengajuan = useMutation({
    mutationFn: (input: NewFundRequest) => createFundRequest(input),
    onSuccess: () => {
      toast.success("Pengajuan dana terkirim.");
      setOpenPengajuan(false);
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
    },
    onError: (e: Error) => toast.error("Gagal mengirim: " + e.message),
  });

  const createReimb = useMutation({
    mutationFn: (input: NewReimbursement) => createReimbursement(input),
    onSuccess: () => {
      toast.success("Permintaan reimbursement terkirim.");
      setOpenReimbursement(false);
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["reimbursement-aging"] });
      queryClient.invalidateQueries({ queryKey: ["my-reimbursements"] });
    },
    onError: (e: Error) => toast.error("Gagal mengirim: " + e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Dana</h1>
          <p className="text-sm text-muted-foreground">
            Ajukan dana sebelum belanja, atau minta ganti kalau kamu sudah menalangi.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="size-4" /> Buat Pengajuan
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem onClick={() => setOpenPengajuan(true)}>
              Ajukan Dana (sebelum belanja)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenReimbursement(true)}>
              Minta Reimbursement (sudah menalangi)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="Semua">Semua</TabsTrigger>
          <TabsTrigger value="Pengajuan">Pengajuan Dana</TabsTrigger>
          <TabsTrigger value="Reimbursement">Reimbursement</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Wallet className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada data pada tampilan ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Nomor</th>
                <th className="p-3">Jenis</th>
                <th className="p-3">Perihal</th>
                <th className="p-3">Pemohon</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Status</th>
                <th className="p-3">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const kind = r.request_kind ?? "Pengajuan";
                const meta = kindMeta(r.request_kind);
                return (
                  <tr key={r.id} className="border-t transition-colors hover:bg-muted/40">
                    <td className="p-3">
                      <Link
                        to="/fund-requests/$id"
                        params={{ id: r.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.request_number ?? "Tanpa nomor"}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="max-w-[260px] p-3">
                      <span className="block truncate">{r.purpose}</span>
                      {r.event_id && (
                        <Link
                          to="/events/$id"
                          params={{ id: r.event_id }}
                          className="mt-1 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-primary hover:underline"
                        >
                          🎯 {eventNameOf(r.event_id)}
                        </Link>
                      )}
                    </td>
                    <td className="p-3">
                      {nameOf(r.requester_id)}
                      <span className="block text-xs text-muted-foreground">
                        {r.requester_division ?? "-"}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{formatRupiah(r.amount_idr)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          STATUS_CLASS[r.status] ?? "bg-muted"
                        }`}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                      {kind === "Reimbursement" && r.expense_date && (
                        <span className="block text-xs text-muted-foreground">
                          Ditalangi {formatDateID(r.expense_date)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {relativeTime(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <FundRequestFormDialog
        open={openPengajuan}
        onOpenChange={setOpenPengajuan}
        onSubmit={(i) => createPengajuan.mutate(i)}
        saving={createPengajuan.isPending}
      />
      <ReimbursementFormDialog
        open={openReimbursement}
        onOpenChange={setOpenReimbursement}
        onSubmit={(i) => createReimb.mutate(i)}
        saving={createReimb.isPending}
      />
    </div>
  );
}
