import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EvidencePicker } from "@/components/hr/EvidencePicker";
import type { Profile } from "@/hooks/useProfile";
import {
  fetchCoachingEvidence,
  fetchMeetingEvidence,
  fetchTaskEvidence,
  WARNING_LEVELS,
  WARNING_LEVEL_LABEL,
} from "@/lib/warnings";
import {
  expectedScope,
  PROPOSABLE_ROLES,
  scopeLabel,
  type NewProposalInput,
} from "@/lib/proposals";

const CHECKLIST = [
  "Saya sudah membaca bukti-bukti di rapor sasaran",
  "Saya paham suara saya anonim tapi bisa dibuka Supervisor kalau ada dugaan penyalahgunaan",
  "Saya paham usulan ini tidak bisa dibatalkan kecuali oleh BPH/Supervisor",
  "Saya paham usulan yang gagal akan tetap tercatat dalam riwayat",
];

function dateInput(offsetDays: number) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export function ProposalFormDialog({
  open,
  onOpenChange,
  profiles,
  me,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profiles: Profile[];
  me: Profile;
  submitting?: boolean;
  onSubmit: (v: NewProposalInput) => void;
}) {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState("");
  const [checks, setChecks] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [level, setLevel] = useState<string>("Teguran_Lisan");
  const [reason, setReason] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [meetings, setMeetings] = useState<string[]>([]);
  const [coachings, setCoachings] = useState<string[]>([]);
  const [endsAt, setEndsAt] = useState(dateInput(5));
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setTarget("");
      setChecks(CHECKLIST.map(() => false));
      setLevel("Teguran_Lisan");
      setReason("");
      setTasks([]);
      setMeetings([]);
      setCoachings([]);
      setEndsAt(dateInput(5));
      setConfirming(false);
    }
  }, [open]);

  const candidates = useMemo(
    () =>
      profiles.filter(
        (p) =>
          p.id !== me.id &&
          p.status === "Active" &&
          PROPOSABLE_ROLES.includes(p.role as (typeof PROPOSABLE_ROLES)[number]),
      ),
    [profiles, me.id],
  );

  const targetProfile = candidates.find((p) => p.id === target) ?? null;
  const scope = targetProfile ? expectedScope(targetProfile.role, targetProfile.division) : "";
  const wrongDivision =
    !!targetProfile && targetProfile.role === "Kadiv" && targetProfile.division !== me.division;
  const eligibleCount = useMemo(() => {
    if (!targetProfile) return 0;
    return profiles.filter(
      (p) =>
        p.status === "Active" &&
        p.id !== targetProfile.id &&
        (scope === "Organisasi" || p.division === targetProfile.division),
    ).length;
  }, [profiles, targetProfile, scope]);

  const taskQ = useQuery({
    queryKey: ["evidence-tasks", target],
    queryFn: () => fetchTaskEvidence(target),
    enabled: !!target && open,
  });
  const meetQ = useQuery({
    queryKey: ["evidence-meetings", target],
    queryFn: () => fetchMeetingEvidence(target),
    enabled: !!target && open,
  });
  const coachQ = useQuery({
    queryKey: ["evidence-coaching", target],
    queryFn: () => fetchCoachingEvidence(target),
    enabled: !!target && open,
  });

  const evidenceCount = tasks.length + meetings.length + coachings.length;
  const endsDate = new Date(`${endsAt}T23:59:00`);
  const days = Math.ceil((endsDate.getTime() - Date.now()) / 86400000);
  const dateValid = days >= 3 && days <= 7;

  const canNext =
    step === 1
      ? !!target && !wrongDivision
      : step === 2
        ? checks.every(Boolean)
        : step === 3
          ? !!level
          : step === 4
            ? reason.trim().length >= 40
            : step === 5
              ? evidenceCount >= 1
              : dateValid;

  function submit() {
    onSubmit({
      target_member_id: target,
      proposed_level: level,
      reason: reason.trim(),
      linked_task_ids: tasks,
      linked_meeting_ids: meetings,
      linked_coaching_ids: coachings,
      voting_ends_at: endsDate.toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Usulan Peringatan — Langkah {step} dari 6</DialogTitle>
          <DialogDescription>
            Usulan ini akan dibaca pemilih dalam ruang lingkup terkait. Isi dengan cermat.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <Label>Pilih sasaran usulan</Label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">— pilih —</option>
              {candidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — {p.role}
                  {p.division ? ` (${p.division})` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Peringatan untuk Anggota biasa tidak melalui usulan bersama; itu diterbitkan langsung
              oleh Kadiv.
            </p>
            {wrongDivision && (
              <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                SP untuk Kadiv hanya bisa diusulkan oleh anggota divisi yang sama.
              </p>
            )}
            {targetProfile && !wrongDivision && (
              <p className="rounded-xl bg-muted p-3 text-sm">
                Ruang lingkup pemilih: <strong>{scopeLabel(scope)}</strong>. Perkiraan jumlah
                pemilih berhak: <strong>{eligibleCount}</strong>.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Centang semua pernyataan berikut untuk melanjutkan.
            </p>
            {CHECKLIST.map((text, i) => (
              <label key={text} className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={checks[i] ?? false}
                  onCheckedChange={(v) =>
                    setChecks((prev) => prev.map((c, j) => (j === i ? Boolean(v) : c)))
                  }
                  className="mt-0.5"
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Label>Tingkat yang diusulkan</Label>
            {WARNING_LEVELS.map((l) => (
              <label key={l} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="level"
                  checked={level === l}
                  onChange={() => setLevel(l)}
                />
                <span>{WARNING_LEVEL_LABEL[l]}</span>
              </label>
            ))}
            {level === "Pemberhentian" && (
              <p className="rounded-xl border-2 border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-800">
                Ini keputusan tertinggi. Pertimbangkan tingkat yang lebih rendah dulu.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label>Alasan usulan</Label>
            <Textarea
              rows={7}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan secara spesifik. Kalimat umum atau menyerang pribadi akan merugikan usulanmu sendiri karena pemilih membacanya."
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/40 karakter minimum.
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tautkan minimal satu bukti. Pemilih akan membuka bukti ini.
            </p>
            <EvidencePicker
              title="Task terkait"
              items={taskQ.data ?? []}
              selected={tasks}
              onChange={setTasks}
              loading={taskQ.isLoading}
              emptyText="Tidak ada task untuk anggota ini."
            />
            <EvidencePicker
              title="Rapat terkait"
              items={meetQ.data ?? []}
              selected={meetings}
              onChange={setMeetings}
              loading={meetQ.isLoading}
              emptyText="Tidak ada catatan kehadiran rapat."
            />
            <EvidencePicker
              title="Catatan bimbingan terkait"
              items={coachQ.data ?? []}
              selected={coachings}
              onChange={setCoachings}
              loading={coachQ.isLoading}
              emptyText="Tidak ada catatan bimbingan."
            />
            {evidenceCount === 0 && (
              <p className="text-sm text-amber-700">Wajib tautkan minimal 1 bukti.</p>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-2">
            <Label>Voting berakhir pada</Label>
            <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Minimal 3 hari, maksimal 7 hari dari sekarang. Bawaan 5 hari.
            </p>
            {!dateValid && (
              <p className="text-sm text-red-700">Tenggat harus antara 3 sampai 7 hari.</p>
            )}
          </div>
        )}

        {confirming && (
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
            Kamu akan mengajukan usulan{" "}
            <strong>{WARNING_LEVEL_LABEL[level] ?? level}</strong> untuk{" "}
            <strong>{targetProfile?.full_name}</strong>. Alasan: “{reason.trim().slice(0, 140)}
            {reason.trim().length > 140 ? "…" : ""}”. {evidenceCount} bukti. Voting berakhir{" "}
            {endsAt}. Sekitar {eligibleCount} pemilih akan dinotifikasi. Setelah dikirim, hanya
            BPH/Supervisor yang bisa membatalkan. Kirim?
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={submit} disabled={submitting}>
                Ya, kirim usulan
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                Batal
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            Kembali
          </Button>
          {step < 6 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Lanjut
            </Button>
          ) : (
            <Button onClick={() => setConfirming(true)} disabled={!canNext || confirming}>
              Kirim Usulan
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
