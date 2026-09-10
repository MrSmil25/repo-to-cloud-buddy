import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDivisions } from "@/hooks/useProfile";
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  STATUS_META,
  TYPE_META,
  createCompany,
  updateCompany,
  type Company,
  type CompanyStatus,
  type CompanyType,
} from "@/lib/companies";
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

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company?: Company | null;
}) {
  const queryClient = useQueryClient();
  const { data: divisions = [] } = useDivisions();
  const [name, setName] = useState("");
  const [type, setType] = useState<CompanyType>("Sponsor");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [division, setDivision] = useState("none");
  const [status, setStatus] = useState<CompanyStatus>("Cold");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(company?.name ?? "");
    setType((company?.type as CompanyType) ?? "Sponsor");
    setIndustry(company?.industry ?? "");
    setWebsite(company?.website ?? "");
    setCity(company?.city ?? "");
    setNotes(company?.notes ?? "");
    setDivision(company?.owner_division ?? "none");
    setStatus((company?.overall_status as CompanyStatus) ?? "Cold");
  }, [open, company]);

  async function save() {
    if (!name.trim()) {
      toast.error("Nama perusahaan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        industry: industry.trim() || null,
        website: website.trim() || null,
        city: city.trim() || null,
        notes: notes.trim() || null,
        owner_division: division === "none" ? null : division,
        overall_status: status,
      };
      if (company) await updateCompany(company.id, payload);
      else await createCompany(payload);
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      await queryClient.invalidateQueries({ queryKey: ["company", company?.id] });
      toast.success(company ? "Perusahaan diperbarui" : "Perusahaan ditambahkan");
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
          <DialogTitle>{company ? "Edit Perusahaan" : "Tambah Perusahaan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama perusahaan *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="PT Contoh Nusantara" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={type} onValueChange={(v) => setType(v as CompanyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_META[t]?.label ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Industri</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Teknologi" />
            </div>
            <div className="space-y-1.5">
              <Label>Kota</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Divisi pemilik</Label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger><SelectValue placeholder="Pilih divisi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
