import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDivisions, useProfiles } from "@/hooks/useProfile";
import {
  ASSIGNMENT_CATEGORIES,
  type AssignmentScope,
  type CreateAssignmentInput,
  type SubmissionVisibility,
} from "@/lib/assignments";

export function AssignmentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateAssignmentInput) => void;
  saving: boolean;
}) {
  const { data: divisions = [] } = useDivisions();
  const { data: profiles = [] } = useProfiles();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState<string>("Refleksi");
  const [scope, setScope] = useState<AssignmentScope>("Semua");
  const [targetDivision, setTargetDivision] = useState<string>("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<SubmissionVisibility>("Supervisor_Saja");
  const [allowText, setAllowText] = useState(true);
  const [allowFile, setAllowFile] = useState(false);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setInstructions("");
    setCategory("Refleksi");
    setScope("Semua");
    setTargetDivision("");
    setMemberIds([]);
    setVisibility("Supervisor_Saja");
    setAllowText(true);
    setAllowFile(false);
    setDueDate("");
  }, [open]);

  function submit() {
    onSubmit({
      title: title.trim(),
      instructions: instructions.trim() || null,
      category,
      scope,
      target_division: scope === "Divisi" ? targetDivision || null : null,
      visibility,
      allow_text: allowText,
      allow_file: allowFile,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      memberIds: scope === "Individu" ? memberIds : [],
    });
  }

  const valid =
    title.trim().length > 0 &&
    (allowText || allowFile) &&
    (scope !== "Divisi" || !!targetDivision) &&
    (scope !== "Individu" || memberIds.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Tugas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Instruksi</Label>
            <Textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sasaran</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as AssignmentScope)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Semua" id="scope-semua" />
                <Label htmlFor="scope-semua" className="font-normal">
                  Semua Anggota
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Divisi" id="scope-divisi" />
                <Label htmlFor="scope-divisi" className="font-normal">
                  Per Divisi
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Individu" id="scope-individu" />
                <Label htmlFor="scope-individu" className="font-normal">
                  Individu
                </Label>
              </div>
            </RadioGroup>
          </div>

          {scope === "Divisi" && (
            <Select value={targetDivision} onValueChange={setTargetDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === "Individu" && (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border p-3">
              {profiles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={memberIds.includes(p.id)}
                    onCheckedChange={(c) =>
                      setMemberIds((prev) =>
                        c ? [...prev, p.id] : prev.filter((x) => x !== p.id),
                      )
                    }
                  />
                  {p.full_name}
                </label>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Visibilitas hasil</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(v) => setVisibility(v as SubmissionVisibility)}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Supervisor_Saja" id="vis-1" />
                <Label htmlFor="vis-1" className="font-normal">
                  Hanya Saya (Pembina)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Supervisor_Ketua_Kadiv" id="vis-2" />
                <Label htmlFor="vis-2" className="font-normal">
                  Saya + Ketua + Kadiv terkait
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Untuk refleksi pribadi yang sensitif, pilih &quot;Hanya Saya&quot; agar anggota mau
              jujur.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Bentuk jawaban</Label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={allowText} onCheckedChange={(c) => setAllowText(!!c)} />
              Boleh teks
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={allowFile} onCheckedChange={(c) => setAllowFile(!!c)} />
              Boleh lampiran file
            </label>
          </div>

          <div className="space-y-2">
            <Label>Tenggat</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
