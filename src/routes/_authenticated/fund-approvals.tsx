import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptPreview } from "@/components/fund-requests/ReceiptPreview";
import { AgingPanel } from "@/components/fund-requests/AgingPanel";
import { formatRupiah, formatDateID, relativeTime } from "@/lib/format";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  fetchFundRequests,
  fetchReimbursementAging,
  approveRequest,
  rejectRequest,
  markDisbursed,
  uploadDocument,
  canApproveFunds,
  kindMeta,
  STATUS_CLASS,
  STATUS_LABEL,
  type FundRequest,
} from "@/lib/fund-requests";

export const Route = createFileRoute("/_authenticated/fund-approvals")({
  head: () => ({
    meta: [
      { title: "Persetujuan Dana & Reimbursement | OrgTool" },
      {
        name: "description",
        content:
          "Panel Controller untuk menyetujui pengajuan dana, memverifikasi struk reimbursement, dan menandai penggantian.",
      },
      { property: "og:title", content: "Persetujuan Dana & Reimbursement" },
      {
        property: "og:description",
        content: "Setujui pengajuan dana dan pantau reimbursement anggota yang belum diganti.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FundApprovalsPage,
});

type Tab = "Pengajuan" | "Reimbursement" | "Menunggu_Ganti";

function FundApprovalsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles } = useProfiles();
  const [tab, setTab] = useState<Tab>("Reimbursement");

  const allowed = canApproveFunds(profile?.role);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["fund-requests"],
    queryFn: fetchFundRequests,
    enabled: allowed,
  });
  const { data: aging, isLoading: agingLoading } = useQuery({
    queryKey: ["reimbursement-aging"],
    queryFn: fetchReimbursementAging,
    enabled: allowed,
  });

  const nameOf = useMemo(() => {
    const map = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return (id: string) => map.get(id) ?? "Anggota";
  }, [profiles]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
    queryClient.invalidateQueries({ queryKey: ["reimbursement-aging"] });
    queryClient.invalidateQueries({ queryKey: ["my-reimbursements"] });
  }

  const approve = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string | undefined }) => approveRequest(id, notes),
    onSuccess: () => {
      toast.success("Disetujui.");
      refresh();
    },
    onError: (e: Error) => toast.error("Gagal menyetujui: " + e.message),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      toast.success("Ditolak.");
      refresh();
    },
    onError: (e: Error) => toast.error("Gagal menolak: " + e.message),
  });
  const disburse = useMutation({
    mutationFn: ({ id, proof }: { id: string; proof?: string | null | undefined }) => markDisbursed(id, proof),
    onSuccess: () => {
      toast.success("Ditandai sudah diganti.");
      refresh();
    },
    onError: (e: Error) => toast.error("Gagal memperbarui: " + e.message),
  });

  if (!allowed) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Halaman ini hanya untuk Controller, Ketua, Waketu, dan Pembina.
        </CardContent>
      </Card>
    );
  }

  const list = requests ?? [];
  const pendingPengajuan = list.filter(
    (r) =>
      (r.request_kind ?? "Pengajuan") === "Pengajuan" &&
      ["Submitted", "Under_Review"].includes(r.status),
  );
  const pendingReimbursement = list.filter(
    (r) => r.request_kind === "Reimbursement" && ["Submitted", "Under_Review"].includes(r.status),
  );
  const approvedReimbursement = list.filter(
    (r) => r.request_kind === "Reimbursement" && r.status === "Approved",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="size-6 text-primary" /> Persetujuan Dana
        </h1>
        <p className="text-sm text-muted-foreground">
          Tinjau pengajuan dana dan verifikasi struk reimbursement anggota.
        </p>
      </div>

      <AgingPanel rows={aging} loading={agingLoading} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="Reimbursement">
            Reimbursement ({pendingReimbursement.length})
          </TabsTrigger>
          <TabsTrigger value="Pengajuan">Pengajuan Dana ({pendingPengajuan.length})</TabsTrigger>
          <TabsTrigger value="Menunggu_Ganti">
            Siap Diganti ({approvedReimbursement.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {(tab === "Reimbursement"
            ? pendingReimbursement
            : tab === "Pengajuan"
              ? pendingPengajuan
              : approvedReimbursement
          ).map((r) => (
            <ReviewCard
              key={r.id}
              request={r}
              requesterName={nameOf(r.requester_id)}
              onApprove={(notes) => approve.mutate({ id: r.id, notes })}
              onReject={(reason) => reject.mutate({ id: r.id, reason })}
              onDisburse={(proof) => disburse.mutate({ id: r.id, proof })}
              busy={approve.isPending || reject.isPending || disburse.isPending}
            />
          ))}
          {(tab === "Reimbursement"
            ? pendingReimbursement
            : tab === "Pengajuan"
              ? pendingPengajuan
              : approvedReimbursement
          ).length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                ✅ Tidak ada yang perlu ditindak pada tab ini.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

type ReviewProps = {
  request: FundRequest;
  requesterName: string;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onDisburse: (proof?: string | null) => void;
  busy: boolean;
};

function ReviewCard({
  request: r,
  requesterName,
  onApprove,
  onReject,
  onDisburse,
  busy,
}: ReviewProps) {
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const isReimbursement = r.request_kind === "Reimbursement";
  const meta = kindMeta(r.request_kind);

  async function handleProof(file?: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadDocument(file, "transfers");
      setProofPath(path);
      toast.success("Bukti transfer terunggah.");
    } catch (err) {
      toast.error("Gagal mengunggah: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              <Link
                to="/fund-requests/$id"
                params={{ id: r.id }}
                className="hover:underline"
              >
                {r.request_number ?? "Tanpa nomor"}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {requesterName} · {r.requester_division ?? "-"} · {relativeTime(r.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.badge}`}>{meta.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[r.status] ?? "bg-muted"}`}
            >
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
            <span className="text-lg font-bold">{formatRupiah(r.amount_idr)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{r.purpose}</p>
        {isReimbursement && (
          <>
            <p className="text-sm text-muted-foreground">
              Ditalangi pada <strong>{formatDateID(r.expense_date)}</strong>
            </p>
            <ReceiptPreview path={r.receipt_url} />
          </>
        )}

        {r.status === "Approved" ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="size-4" />
                {uploading
                  ? "Mengunggah…"
                  : proofPath
                    ? "Bukti transfer siap"
                    : "Unggah Bukti Transfer (opsional)"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleProof(e.target.files?.[0])}
                />
              </label>
            </Button>
            <Button size="sm" disabled={busy || uploading} onClick={() => onDisburse(proofPath)}>
              Tandai Sudah Diganti
            </Button>
          </div>
        ) : (
          <div className="space-y-2 border-t pt-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => onApprove()}>
                Setujui
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReject((v) => !v)}
                disabled={busy}
              >
                Tolak
              </Button>
            </div>
            {showReject && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Alasan penolakan (wajib)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy || reason.trim().length === 0}
                  onClick={() => onReject(reason.trim())}
                >
                  Kirim Penolakan
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
