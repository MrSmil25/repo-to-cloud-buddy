import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CONTACT_CHANNELS,
  CONTACT_CHANNEL_LABELS,
  CONTACT_ROLES,
  CONTACT_ROLE_LABELS,
  createPerson,
  updatePerson,
  type ContactChannel,
  type ContactRole,
  type Person,
} from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function ContactFormDialog({
  open,
  onOpenChange,
  companyId,
  person,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  person?: Person | null;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [role, setRole] = useState<string>("none");
  const [channel, setChannel] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(person?.full_name ?? "");
    setTitle(person?.title ?? "");
    setEmail(person?.email ?? "");
    setPhone(person?.phone ?? "");
    setLinkedin(person?.linkedin_url ?? "");
    setRole(person?.role_in_relation ?? "none");
    setChannel(person?.preferred_channel ?? "none");
  }, [open, person]);

  async function save() {
    if (!fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        title: title.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        linkedin_url: linkedin.trim() || null,
        role_in_relation: role === "none" ? null : (role as ContactRole),
        preferred_channel: channel === "none" ? null : (channel as ContactChannel),
      };
      if (person) await updatePerson(person.id, payload);
      else await createPerson(companyId, payload);
      await queryClient.invalidateQueries({ queryKey: ["company-people", companyId] });
      toast.success(person ? "Kontak diperbarui" : "Kontak ditambahkan");
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
          <DialogTitle>{person ? "Edit Kontak" : "Tambah Kontak"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nama lengkap *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Jabatan</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Nomor telepon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://" />
          </div>
          <div className="space-y-1.5">
            <Label>Peran dalam relasi</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belum ditentukan</SelectItem>
                {CONTACT_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{CONTACT_ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Channel favorit</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belum ditentukan</SelectItem>
                {CONTACT_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>{CONTACT_CHANNEL_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
