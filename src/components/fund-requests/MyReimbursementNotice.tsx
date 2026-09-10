import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { supabase } from "@/lib/supabase-external";
import { fetchMyPendingReimbursements } from "@/lib/fund-requests";
import { formatRupiah } from "@/lib/format";

/** Pengingat halus untuk anggota: reimbursement sendiri yang belum diganti. */
export function MyReimbursementNotice() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data } = useQuery({
    queryKey: ["my-reimbursements", userId],
    queryFn: () => fetchMyPendingReimbursements(userId as string),
    enabled: !!userId,
  });

  const rows = data ?? [];
  if (rows.length === 0) return null;

  const total = rows.reduce((a, r) => a + Number(r.amount_idr ?? 0), 0);
  const oldest = Math.max(...rows.map((r) => Number(r.days_outstanding ?? 0)));

  return (
    <Link
      to="/fund-requests"
      className="flex items-start gap-3 rounded-xl border border-violet-300 bg-violet-50 p-3 text-sm transition-colors hover:bg-violet-100 dark:bg-violet-950/30"
    >
      <Info className="mt-0.5 size-4 text-violet-600" />
      <p>
        Reimbursement kamu <strong>{formatRupiah(total)}</strong> sedang diproses ({oldest} hari
        {rows.length > 1 ? `, ${rows.length} pengajuan` : ""}). Klik untuk melihat statusnya.
      </p>
    </Link>
  );
}
