import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/useProfile";
import { fetchCompanies } from "@/lib/companies";
import { uploadDocument } from "@/lib/fund-requests";
import {
  MOU_STATUSES,
  MOU_STATUS_META,
  createMou,
  fetchDealOptionsByCompany,
  updateMou,
  type MouStatus,
  type MouWithRelations,
} from "@/lib/mous";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MouFormDialog({
  open,
  onOpenChange,
  defaultCompanyId,
  mou,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCompanyId?: string;
  mou?: MouWithRelations | null;
}) {
  const queryClient = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });

  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState("none");
  const [dealId, setDealId] = useState("none");
  const [signedDate, setSignedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ourSignatory, setOurSignatory] = useState("none");
  const [theirName, setTheirName] = useState("");
  const [theirTitle, setTheirTitle] = useState("");
  const [status, setStatus] = useState<MouStatus>("Draft");
  const [reminderDays, setReminderDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: deals = [] } = useQuery({
    queryKey: ["mou-deals", companyId],
    queryFn: () => fetchDealOptionsByCompany(companyId),
    enabled: companyId !== "none",
  });

  useEffect(() => {
    if (!open) return;
    setTitle(mou?.title ?? "");
    setCompanyId(mou?.company_id ?? defaultCompanyId ?? "none");
    setDealId(mou?.deal_id ?? "none");
    setSignedDate(mou?.signed_date ?? "");
    setExpiryDate(mou?.expiry_date ?? "");
    setPdfPath(mou?.pdf_url ?? null);
    setFile(null);
    setOurSignatory(mou?.signatory_our_side_id ?? "none");
    setTheirName(mou?.signatory_their_name ?? "");
    setTheirTitle(mou?.signatory_their_title ?? "");
    setStatus(mou?.status ?? "Draft");
    setReminderDays(String(mou?.renewal_reminder_days ?? 30));
    setNotes(mou?.notes ?? "");
  }, [open, mou, defaultCompanyId]);

  async function save() {
    if (!title.trim()) {
      toast.error("Judul MoU wajib diisi");
      return;
    }
    setSaving(true);
    try {
      let path = pdfPath;
      if (file) path = await uploadDocument(file, "mous");
      const input = {
        title: title.trim(),
        company_id: companyId === "none" ? null : companyId,
        deal_id: dealId === "none" ? null : dealId,
        signed_date: signedDate || null,
        expiry_date: expiryDate || null,
        pdf_url: path,
        signatory_our_side_id: ourSignatory === "none" ? null : ourSignatory,
        signatory_their_name: theirName.trim() || null,
        signatory_their_title: theirTitle.trim() || null,
        status,
        renewal_reminder_days: Number(reminderDays) || null,
        notes: notes.trim() || null,
      };
      if (mou) await updateMou(mou.id, input);
      else await createMou(input);
      await queryClient.invalidateQueries({ queryKey: ["mous"] });
      await queryClient.invalidateQueries({ queryKey: ["company-mous"] });
      toast.success(mou ? "MoU diperbarui" : "MoU ditambahkan");
      onOpenChange(false);
    } catch (e) {
      toast.error("Gagal menyimpan: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mou ? "Edit MoU" : "MoU Baru"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Judul *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="MoU Kerja Sama 2026" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Perusahaan</Label>
              <Select
                value={companyId}
                onValueChange={(v) => {
                  setCompanyId(v);
                  setDealId("none");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deal terkait</Label>
              <Select value={dealId} onValueChange={setDealId} disabled={companyId === "none"}>
                <SelectTrigger><SelectValue placeholder="Opsional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal tanda tangan</Label>
              <Input type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal expired</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Penandatangan kita</Label>
              <Select value={ourSignatory} onValueChange={setOurSignatory}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MouStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOU_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{MOU_STATUS_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nama penandatangan mereka</Label>
              <Input value={theirName} onChange={(e) => setTheirName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Jabatan mereka</Label>
              <Input value={theirTitle} onChange={(e) => setTheirTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reminder H- (hari)</Label>
              <Input
                inputMode="numeric"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dokumen PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {pdfPath && !file && <p className="text-xs text-muted-foreground">Dokumen sudah terunggah</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
