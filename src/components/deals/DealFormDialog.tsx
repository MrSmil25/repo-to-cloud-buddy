import { eventOptionLabel } from "@/lib/events";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDivisions, useProfiles } from "@/hooks/useProfile";
import { fetchCompanies } from "@/lib/companies";
import {
  DEAL_STAGES,
  DEAL_TYPES,
  DEAL_TYPE_LABELS,
  STAGE_META,
  createDeal,
  fetchEventOptions,
  fetchPeopleByCompany,
  type DealStage,
  type DealType,
} from "@/lib/deals";
import { formatRupiah } from "@/lib/format";
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

export function DealFormDialog({
  open,
  onOpenChange,
  defaultCompanyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCompanyId?: string;
}) {
  const queryClient = useQueryClient();
  const { data: divisions = [] } = useDivisions();
  const { data: profiles = [] } = useProfiles();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });
  const { data: events = [] } = useQuery({ queryKey: ["event-options"], queryFn: fetchEventOptions });

  const [name, setName] = useState("");
  const [dealType, setDealType] = useState<DealType>("Sponsorship");
  const [companyId, setCompanyId] = useState("none");
  const [contactId, setContactId] = useState("none");
  const [division, setDivision] = useState("none");
  const [pic, setPic] = useState("none");
  const [stage, setStage] = useState<DealStage>("Prospect");
  const [value, setValue] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eventId, setEventId] = useState("none");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: people = [] } = useQuery({
    queryKey: ["deal-people", companyId],
    queryFn: () => fetchPeopleByCompany(companyId),
    enabled: companyId !== "none",
  });

  useEffect(() => {
    if (!open) return;
    setName("");
    setDealType("Sponsorship");
    setCompanyId(defaultCompanyId ?? "none");
    setContactId("none");
    setDivision("none");
    setPic("none");
    setStage("Prospect");
    setValue("");
    setDeliverables("");
    setDeadline("");
    setEventId("none");
    setNotes("");
  }, [open, defaultCompanyId]);

  const numericValue = Number(value.replace(/\D/g, "")) || 0;

  async function save() {
    if (!name.trim()) {
      toast.error("Nama deal wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await createDeal({
        name: name.trim(),
        deal_type: dealType,
        company_id: companyId === "none" ? null : companyId,
        primary_contact_id: contactId === "none" ? null : contactId,
        owner_division: division === "none" ? null : division,
        owner_person_id: pic === "none" ? null : pic,
        stage,
        value_idr: numericValue || null,
        deliverables: deliverables.trim() || null,
        deadline: deadline || null,
        event_id: eventId === "none" ? null : eventId,
        notes: notes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["deals"] });
      await queryClient.invalidateQueries({ queryKey: ["company-deals"] });
      toast.success("Deal ditambahkan");
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
          <DialogTitle>Deal Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama deal *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sponsorship Utama Expo" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Select value={dealType} onValueChange={(v) => setDealType(v as DealType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DEAL_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tahap</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_META[s]?.label ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Perusahaan</Label>
              <Select
                value={companyId}
                onValueChange={(v) => {
                  setCompanyId(v);
                  setContactId("none");
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
              <Label>Kontak utama</Label>
              <Select value={contactId} onValueChange={setContactId} disabled={companyId === "none"}>
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
            <div className="space-y-1.5">
              <Label>PIC</Label>
              <Select value={pic} onValueChange={setPic}>
                <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nilai (IDR)</Label>
              <Input
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
                placeholder="50000000"
              />
              <p className="text-xs text-muted-foreground">{formatRupiah(numericValue)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tenggat</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Event terkait</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Opsional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{eventOptionLabel(e)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Deliverables</Label>
            <Textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={3} />
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
