import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchCompanies, fetchPeople } from "@/lib/companies";
import {
  createSpeaker,
  updateSpeaker,
  uploadFile,
  type Speaker,
} from "@/lib/events";
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

export function SpeakerFormDialog({
  open,
  onOpenChange,
  speaker,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  speaker?: Speaker | null;
  onCreated?: (speaker: Speaker) => void;
}) {
  const queryClient = useQueryClient();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });

  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [expertise, setExpertise] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("");
  const [companyId, setCompanyId] = useState("none");
  const [contactPersonId, setContactPersonId] = useState("none");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [cvPath, setCvPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: people = [] } = useQuery({
    queryKey: ["company-people", companyId],
    queryFn: () => fetchPeople(companyId),
    enabled: companyId !== "none",
  });

  useEffect(() => {
    if (!open) return;
    setFullName(speaker?.full_name ?? "");
    setTitle(speaker?.title ?? "");
    setExpertise(speaker?.expertise ?? "");
    setBio(speaker?.bio_short ?? "");
    setRate(speaker?.default_rate_idr != null ? String(speaker.default_rate_idr) : "");
    setCompanyId(speaker?.company_id ?? "none");
    setContactPersonId(speaker?.contact_person_id ?? "none");
    setEmail(speaker?.direct_email ?? "");
    setPhone(speaker?.direct_phone ?? "");
    setNotes(speaker?.notes ?? "");
    setPhotoPath(speaker?.photo_url ?? null);
    setCvPath(speaker?.cv_url ?? null);
  }, [open, speaker]);

  async function upload(bucket: string, folder: string, file: File, set: (p: string) => void) {
    setUploading(true);
    try {
      const path = await uploadFile(bucket, folder, file);
      set(path);
      toast.success("Berkas terunggah");
    } catch (e) {
      toast.error("Gagal mengunggah: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Nama speaker wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      title: title.trim() || null,
      expertise: expertise.trim() || null,
      bio_short: bio.trim() || null,
      photo_url: photoPath,
      cv_url: cvPath,
      default_rate_idr: rate ? Number(rate) : null,
      company_id: companyId === "none" ? null : companyId,
      contact_person_id: contactPersonId === "none" ? null : contactPersonId,
      direct_email: email.trim() || null,
      direct_phone: phone.trim() || null,
      notes: notes.trim() || null,
    };
    try {
      if (speaker) {
        await updateSpeaker(speaker.id, payload);
        await queryClient.invalidateQueries({ queryKey: ["speaker", speaker.id] });
      } else {
        const created = await createSpeaker(payload);
        onCreated?.(created);
      }
      await queryClient.invalidateQueries({ queryKey: ["speakers"] });
      toast.success(speaker ? "Speaker diperbarui" : "Speaker ditambahkan");
      onOpenChange(false);
    } catch (err) {
      toast.error("Gagal menyimpan: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{speaker ? "Edit Speaker" : "Tambah Speaker"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sp-name">Nama Lengkap *</Label>
              <Input id="sp-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-title">Title / Jabatan</Label>
              <Input id="sp-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-exp">Bidang Keahlian</Label>
              <Input id="sp-exp" value={expertise} onChange={(e) => setExpertise(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sp-bio">Bio Singkat</Label>
              <Textarea id="sp-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-photo">Foto</Label>
              <Input
                id="sp-photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload("speakers", "photos", f, setPhotoPath);
                }}
              />
              <p className="text-xs text-muted-foreground">{photoPath ? "Foto tersimpan." : "Belum ada foto."}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-cv">CV</Label>
              <Input
                id="sp-cv"
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload("documents", "speaker-cv", f, setCvPath);
                }}
              />
              <p className="text-xs text-muted-foreground">{cvPath ? "CV tersimpan." : "Belum ada CV."}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-rate">Default Rate (Rp)</Label>
              <Input id="sp-rate" type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Afiliasi Perusahaan</Label>
              <Select
                value={companyId}
                onValueChange={(v) => {
                  setCompanyId(v);
                  setContactPersonId("none");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pilih perusahaan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa afiliasi</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kontak Perantara</Label>
              <Select value={contactPersonId} onValueChange={setContactPersonId} disabled={companyId === "none"}>
                <SelectTrigger><SelectValue placeholder="Pilih kontak" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-email">Email Langsung</Label>
              <Input id="sp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-phone">Phone Langsung</Label>
              <Input id="sp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sp-notes">Catatan</Label>
              <Textarea id="sp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving || uploading}>{saving ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
