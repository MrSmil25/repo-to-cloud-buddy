import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateID } from "@/lib/format";
import {
  fetchLinkedEvidence,
  WARNING_LEVEL_ACCENT,
  WARNING_LEVEL_BADGE,
  WARNING_LEVEL_LABEL,
  WARNING_STATUS_BADGE,
  type WarningRow,
} from "@/lib/warnings";

export function WarningCard({
  warning,
  isMine,
  canRevoke,
  onAcknowledge,
  onSaveResponse,
  onRevoke,
  busy,
}: {
  warning: WarningRow;
  isMine: boolean;
  canRevoke: boolean;
  onAcknowledge: (id: string) => void;
  onSaveResponse: (id: string, response: string) => void;
  onRevoke: (id: string, reason: string) => void;
  busy?: boolean;
}) {
  const w = warning;
  const [response, setResponse] = useState(w.member_response ?? "");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  const { data: evidence } = useQuery({
    queryKey: ["warning-evidence", w.id],
    queryFn: () => fetchLinkedEvidence(w),
  });

  const needsAck = isMine && !w.member_acknowledged && w.status === "Berlaku";

  return (
    <article
      className={`rounded-2xl border bg-card p-5 shadow-sm ${WARNING_LEVEL_ACCENT[w.level] ?? ""} ${
        needsAck ? "ring-2 ring-amber-300" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-lg px-3 py-1 text-sm font-bold ${WARNING_LEVEL_BADGE[w.level] ?? "bg-muted"}`}
            >
              {WARNING_LEVEL_LABEL[w.level] ?? w.level}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${WARNING_STATUS_BADGE[w.status] ?? "bg-muted"}`}
            >
              {w.status}
            </span>
            {w.source === "Usulan_Vote" && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">Hasil usulan</span>
            )}
          </div>
          {!isMine && (
            <p className="text-sm font-semibold">
              {w.member?.full_name ?? "Anggota"}
              {w.member?.division ? ` — ${w.member.division}` : ""}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Terbit {formatDateID(w.issued_at ?? w.created_at)} · oleh {w.issuer?.full_name ?? "—"}
          </p>
          {w.effective_until && (
            <p className="text-xs text-muted-foreground">
              Berlaku sampai: {formatDateID(w.effective_until)}
            </p>
          )}
        </div>

        {canRevoke && w.status === "Berlaku" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aksi peringatan">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRevokeOpen(true)}>Cabut</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">{w.reason}</p>

      <section className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bukti terlampir
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {(evidence?.tasks ?? []).map((t) => (
            <li key={t.id}>
              <Link to="/workspace" className="text-primary hover:underline">
                Task: {t.title}
              </Link>
            </li>
          ))}
          {(evidence?.meetings ?? []).map((m) => (
            <li key={m.id}>
              <Link
                to="/meetings/$id"
                params={{ id: m.id }}
                className="text-primary hover:underline"
              >
                Rapat: {m.title}
                {m.meeting_date ? ` (${formatDateID(m.meeting_date)})` : ""}
              </Link>
            </li>
          ))}
          {(evidence?.coachings ?? []).map((c) => (
            <li key={c.id}>
              <Link to="/coaching" className="text-primary hover:underline">
                Bimbingan: {c.topic} ({formatDateID(c.created_at)})
              </Link>
            </li>
          ))}
          {!evidence ||
          evidence.tasks.length + evidence.meetings.length + evidence.coachings.length === 0 ? (
            <li className="text-muted-foreground">Bukti tidak dapat ditampilkan.</li>
          ) : null}
        </ul>
      </section>

      {w.status === "Dicabut" && (
        <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
          <p className="font-semibold">Peringatan ini dicabut</p>
          {w.revoked_at && (
            <p className="text-xs text-muted-foreground">{formatDateID(w.revoked_at)}</p>
          )}
          {w.revoke_reason && <p className="mt-1">{w.revoke_reason}</p>}
        </div>
      )}

      {w.member_response && (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <p className="font-semibold">Tanggapan Anggota</p>
          <p className="mt-1 whitespace-pre-wrap">{w.member_response}</p>
        </div>
      )}

      {isMine && (
        <div className="mt-4 space-y-3">
          {needsAck ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                Peringatan ini ditujukan untukmu. Tandai bahwa kamu sudah membacanya.
              </p>
              <Button className="mt-3" disabled={busy} onClick={() => onAcknowledge(w.id)}>
                Saya sudah membaca peringatan ini
              </Button>
            </div>
          ) : (
            <>
              {w.acknowledged_at && (
                <p className="text-xs text-muted-foreground">
                  Kamu menandai sudah membaca pada {formatDateID(w.acknowledged_at)}.
                </p>
              )}
              {w.member_acknowledged && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`resp-${w.id}`}>
                    Tanggapan / Klarifikasi (opsional)
                  </label>
                  <Textarea
                    id={`resp-${w.id}`}
                    rows={3}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onSaveResponse(w.id, response.trim())}
                  >
                    Simpan tanggapan
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cabut peringatan</DialogTitle>
            <DialogDescription>
              Catatan tetap tersimpan sebagai riwayat, statusnya berubah menjadi Dicabut.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Alasan pencabutan"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={revokeReason.trim().length === 0 || busy}
              onClick={() => {
                onRevoke(w.id, revokeReason.trim());
                setRevokeOpen(false);
                setRevokeReason("");
              }}
            >
              Cabut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
