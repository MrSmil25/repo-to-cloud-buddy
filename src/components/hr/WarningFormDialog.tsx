import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EvidencePicker } from "@/components/hr/EvidencePicker";
import type { Profile } from "@/hooks/useProfile";
import { fetchMemberReport } from "@/lib/hr";
import {
  fetchCoachingEvidence,
  fetchMeetingEvidence,
  fetchTaskEvidence,
  fetchWarnings,
  levelRank,
  WARNING_LEVELS,
  WARNING_LEVEL_LABEL,
  type NewWarningInput,
} from "@/lib/warnings";
import { formatDateID } from "@/lib/format";

const STEPS = [
  "Pilih Anggota",
  "Tingkatan",
  "Alasan",
  "Bukti",
  "Masa Berlaku",
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function WarningFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
  candidates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: NewWarningInput) => void;
  submitting?: boolean;
  candidates: Profile[];
}) {
  const [step, setStep] = useState(0);
  const [memberId, setMemberId] = useState("");
  const [level, setLevel] = useState<string>("Teguran_Lisan");
  const [reason, setReason] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [meetingIds, setMeetingIds] = useState<string[]>([]);
  const [coachingIds, setCoachingIds] = useState<string[]>([]);
  const [until, setUntil] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setMemberId("");
      setLevel("Teguran_Lisan");
      setReason("");
      setTaskIds([]);
      setMeetingIds([]);
      setCoachingIds([]);
      setUntil("");
      setConfirming(false);
    }
  }, [open]);

  const member = candidates.find((c) => c.id === memberId);

  const report = useQuery({
    queryKey: ["member-report", memberId, "warning-modal"],
    queryFn: () => fetchMemberReport(memberId, isoDaysAgo(90), new Date().toISOString().slice(0, 10)),
    enabled: !!memberId && open,
  });

  const existing = useQuery({
    queryKey: ["warnings", "active", memberId],
    queryFn: () => fetchWarnings({ memberId, activeOnly: true }),
    enabled: !!memberId && open,
  });

  const tasks = useQuery({
    queryKey: ["warning-evidence-tasks", memberId],
    queryFn: () => fetchTaskEvidence(memberId),
    enabled: !!memberId && open,
  });
  const meetings = useQuery({
    queryKey: ["warning-evidence-meetings", memberId],
    queryFn: () => fetchMeetingEvidence(memberId),
    enabled: !!memberId && open,
  });
  const coachings = useQuery({
    queryKey: ["warning-evidence-coaching", memberId],
    queryFn: () => fetchCoachingEvidence(memberId),
    enabled: !!memberId && open,
  });

  const highest = useMemo(() => {
    const rows = existing.data ?? [];
    if (rows.length === 0) return null;
    return rows.reduce((a, b) => (levelRank(b.level) > levelRank(a.level) ? b : a));
  }, [existing.data]);

  const suggested: (typeof WARNING_LEVELS)[number] = highest
    ? (WARNING_LEVELS[Math.min(levelRank(highest.level) + 1, WARNING_LEVELS.length - 1)] ??
      "Teguran_Lisan")
    : "Teguran_Lisan";

  const skipping = levelRank(level) > levelRank(suggested);
  const evidenceCount = taskIds.length + meetingIds.length + coachingIds.length;
  const reasonOk = reason.trim().length >= 20;

  const stepValid = [
    !!memberId,
    !!level,
    reasonOk,
    evidenceCount > 0,
    true,
  ][step];

  const canSubmit = !!memberId && !!level && reasonOk && evidenceCount > 0;

  function submit() {
    onSubmit({
      member_id: memberId,
      level,
      reason: reason.trim(),
      linked_task_ids: taskIds,
      linked_meeting_ids: meetingIds,
      linked_coaching_ids: coachingIds,
      effective_until: until || null,
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terbitkan Peringatan Resmi</DialogTitle>
            <DialogDescription>
              Tindakan formal. Isi bertahap dan pastikan setiap poin didukung bukti.
            </DialogDescription>
          </DialogHeader>

          <ol className="flex flex-wrap gap-2 text-xs">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`rounded-full px-3 py-1 font-medium ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-secondary text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>

          {/* Langkah 1 */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Anggota *</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih anggota" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                        {p.division ? ` — ${p.division}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ringkasan rapor 90 hari terakhir akan muncul agar keputusan berbasis data.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                {!memberId ? (
                  <p className="text-muted-foreground">Pilih anggota untuk melihat rapornya.</p>
                ) : report.isLoading ? (
                  <p className="text-muted-foreground">Memuat rapor…</p>
                ) : report.data ? (
                  <ul className="space-y-1">
                    <li className="font-semibold">{report.data.full_name}</li>
                    <li>Penyelesaian task: {report.data.completion_rate}%</li>
                    <li>
                      Task selesai {report.data.tasks_done} dari {report.data.tasks_total}, tertunggak{" "}
                      {report.data.tasks_overdue}
                    </li>
                    <li>Kehadiran rapat: {report.data.attendance_rate}% (alpa {report.data.meetings_alpa})</li>
                    <li>Pengumpulan tugas pembina: {report.data.submission_rate}%</li>
                    <li>Pelunasan kas: {report.data.kas_rate}%</li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Rapor tidak tersedia untuk akses Anda.</p>
                )}
              </div>
            </div>
          )}

          {/* Langkah 2 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                {existing.isLoading
                  ? "Memeriksa riwayat…"
                  : highest
                    ? `Anggota ini sudah pernah menerima ${WARNING_LEVEL_LABEL[highest.level]} yang masih berlaku. Jenjang berikutnya: ${WARNING_LEVEL_LABEL[suggested]}.`
                    : "Anggota ini belum pernah menerima peringatan. Disarankan mulai dari Teguran Lisan."}
              </div>

              <RadioGroup value={level} onValueChange={setLevel} className="space-y-2">
                {WARNING_LEVELS.map((l) => (
                  <label
                    key={l}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm hover:bg-accent/40"
                  >
                    <RadioGroupItem value={l} />
                    <span className="font-medium">{WARNING_LEVEL_LABEL[l]}</span>
                    {l === suggested && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">
                        disarankan
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>

              {skipping && level !== "Pemberhentian" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Kamu melompati jenjang. Yakin? Keputusan tetap ada di tanganmu, ini hanya
                  pengingat agar prosesnya adil.
                </div>
              )}

              {level === "Pemberhentian" && (
                <div className="space-y-2 rounded-xl border-2 border-red-400 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Ini keputusan akhir.</p>
                  <p>Sebelum lanjut, lihat Daftar Serah Terima anggota ini agar tidak ada tanggung jawab yang menggantung.</p>
                  {memberId && (
                    <Link
                      to="/reports/holdings/$id"
                      params={{ id: memberId }}
                      className="inline-block rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Buka Serah Terima {member?.full_name ?? ""}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Langkah 3 */}
          {step === 2 && (
            <div className="space-y-1.5">
              <Label htmlFor="warning-reason">Alasan *</Label>
              <Textarea
                id="warning-reason"
                rows={6}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan pelanggaran/masalah dengan spesifik. Hindari kalimat umum seperti 'malas'. Contoh baik: '5 task tidak selesai tepat waktu dalam 30 hari terakhir, 2 rapat divisi tanpa keterangan.'"
              />
              <p className={`text-xs ${reasonOk ? "text-muted-foreground" : "text-amber-700"}`}>
                {reason.trim().length}/20 karakter minimum.
              </p>
            </div>
          )}

          {/* Langkah 4 */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Wajib tautkan minimal 1 bukti. Baca dulu isinya sebelum mencentang.
              </p>
              <EvidencePicker
                title="Task terkait"
                items={tasks.data ?? []}
                selected={taskIds}
                onChange={setTaskIds}
                loading={tasks.isLoading}
                emptyText="Tidak ada task milik anggota ini."
              />
              <EvidencePicker
                title="Rapat terkait"
                items={meetings.data ?? []}
                selected={meetingIds}
                onChange={setMeetingIds}
                loading={meetings.isLoading}
                emptyText="Tidak ada catatan kehadiran rapat."
              />
              <EvidencePicker
                title="Catatan bimbingan terkait"
                items={coachings.data ?? []}
                selected={coachingIds}
                onChange={setCoachingIds}
                loading={coachings.isLoading}
                emptyText="Belum ada catatan bimbingan."
              />
              {evidenceCount === 0 && (
                <p className="text-sm text-amber-700">Wajib tautkan minimal 1 bukti.</p>
              )}
            </div>
          )}

          {/* Langkah 5 */}
          {step === 4 && (
            <div className="space-y-1.5">
              <Label htmlFor="warning-until">Berlaku sampai</Label>
              <Input
                id="warning-until"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Peringatan biasanya berlaku 3 bulan. Kosongkan untuk berlaku sampai dicabut.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Kembali
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!stepValid} onClick={() => setStep((s) => s + 1)}>
                Lanjut
              </Button>
            ) : (
              <Button disabled={!canSubmit || submitting} onClick={() => setConfirming(true)}>
                Terbitkan
              </Button>
            )}
          </DialogFooter>
          {step === STEPS.length - 1 && !canSubmit && (
            <p className="text-right text-xs text-amber-700">
              {evidenceCount === 0
                ? "Wajib tautkan minimal 1 bukti."
                : "Lengkapi anggota dan alasan terlebih dahulu."}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi penerbitan</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Kamu akan menerbitkan <strong>{WARNING_LEVEL_LABEL[level]}</strong> untuk{" "}
                  <strong>{member?.full_name ?? "-"}</strong>.
                </p>
                <p className="rounded-lg bg-muted p-2">
                  Alasan: {reason.trim().slice(0, 200)}
                  {reason.trim().length > 200 ? "…" : ""}
                </p>
                <p>{evidenceCount} bukti terlampir.</p>
                {until && <p>Berlaku sampai {formatDateID(until)}.</p>}
                <p>
                  Setelah diterbitkan, catatan ini tidak bisa dihapus — hanya bisa dicabut. Lanjut?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirming(false);
                submit();
              }}
            >
              Ya, terbitkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
