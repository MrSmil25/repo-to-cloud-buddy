import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-external";
import { useDivisions, useMyProfile, isBPH } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { formatDateID } from "@/lib/format";
import {
  USER_ROLES,
  copyText,
  fetchInvitations,
  generateDivisionCode,
  generatePersonalToken,
  registerLink,
  type Invitation,
} from "@/lib/invitations";

export const Route = createFileRoute("/_authenticated/invitations")({
  head: () => ({
    meta: [
      { title: "Undangan Anggota — OrgTool" },
      {
        name: "description",
        content: "Kelola kode divisi dan link personal untuk mengundang anggota baru.",
      },
      { property: "og:title", content: "Undangan Anggota — OrgTool" },
      {
        property: "og:description",
        content: "Kelola kode divisi dan link personal untuk mengundang anggota baru.",
      },
    ],
  }),
  component: InvitationsPage,
});

function InvitationsPage() {
  const { data: me } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();
  const allowed = isBPH(me?.role);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: fetchInvitations,
    enabled: allowed,
  });

  const [divOpen, setDivOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">Akses terbatas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hanya Ketua, Wakil Ketua, dan Supervisor yang dapat mengelola undangan.
        </p>
      </div>
    );
  }

  const divisionCodes = invitations.filter((i) => i.kind === "Kode_Divisi");
  const personalLinks = invitations.filter((i) => i.kind === "Link_Personal");

  function divisionName(code: string | null) {
    if (!code) return "-";
    return divisions.find((d) => d.code === code)?.name ?? code;
  }

  async function copy(value: string, label: string) {
    try {
      await copyText(value);
      toast.success(`${label} disalin`);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  async function deactivate(inv: Invitation) {
    const { error } = await supabase
      .from("invitations")
      .update({ is_active: false })
      .eq("id", inv.id);
    if (error) {
      toast.error("Gagal menonaktifkan: " + error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    toast.success("Undangan dinonaktifkan");
  }

  async function remove(inv: Invitation) {
    const { error } = await supabase.from("invitations").delete().eq("id", inv.id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    toast.success("Undangan dihapus");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Undangan Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Buat kode divisi untuk pendaftaran massal, atau link personal untuk menunjuk orang
          tertentu.
        </p>
      </div>

      <Tabs defaultValue="division">
        <TabsList>
          <TabsTrigger value="division">Kode Divisi</TabsTrigger>
          <TabsTrigger value="personal">Link Personal</TabsTrigger>
        </TabsList>

        <TabsContent value="division" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDivOpen(true)}>+ Buat Kode Divisi</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Divisi</th>
                  <th className="px-4 py-3">Role Default</th>
                  <th className="px-4 py-3">Dipakai</th>
                  <th className="px-4 py-3">Berlaku Sampai</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data…
                    </td>
                  </tr>
                )}
                {!isLoading && divisionCodes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada kode divisi.
                    </td>
                  </tr>
                )}
                {divisionCodes.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold">{inv.code}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {registerLink(inv.code)}
                      </p>
                    </td>
                    <td className="px-4 py-3">{divisionName(inv.division)}</td>
                    <td className="px-4 py-3">{inv.default_role ?? "Anggota"}</td>
                    <td className="px-4 py-3">
                      {inv.used_count ?? 0} / {inv.max_uses ?? "tak terbatas"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.expires_at ? formatDateID(inv.expires_at) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          inv.is_active
                            ? "rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
                            : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {inv.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => copy(inv.code, "Kode")}>
                          Salin Kode
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copy(registerLink(inv.code), "Link")}
                        >
                          Salin Link
                        </Button>
                        {inv.is_active && (
                          <Button variant="outline" size="sm" onClick={() => deactivate(inv)}>
                            Nonaktifkan
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => remove(inv)}>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPersonalOpen(true)}>+ Buat Link Personal</Button>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nama Tujuan</th>
                  <th className="px-4 py-3">Email Tujuan</th>
                  <th className="px-4 py-3">Divisi</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data…
                    </td>
                  </tr>
                )}
                {!isLoading && personalLinks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada link personal.
                    </td>
                  </tr>
                )}
                {personalLinks.map((inv) => {
                  const used = (inv.used_count ?? 0) >= 1;
                  return (
                    <tr
                      key={inv.id}
                      className={`border-b last:border-0 ${used ? "text-muted-foreground" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium">{inv.intended_name ?? "-"}</td>
                      <td className="px-4 py-3">{inv.intended_email ?? "-"}</td>
                      <td className="px-4 py-3">{divisionName(inv.assigned_division)}</td>
                      <td className="px-4 py-3">{inv.assigned_role ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            used
                              ? "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                              : "rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
                          }
                        >
                          {used ? "Terpakai" : "Belum"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copy(registerLink(inv.code), "Link")}
                          >
                            Salin Link
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => remove(inv)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <DivisionCodeDialog
        open={divOpen}
        onOpenChange={setDivOpen}
        divisions={divisions}
        userId={me?.id ?? null}
      />
      <PersonalLinkDialog
        open={personalOpen}
        onOpenChange={setPersonalOpen}
        divisions={divisions}
        userId={me?.id ?? null}
      />
    </div>
  );
}

type DivisionOption = { code: string; name: string };

function DivisionCodeDialog({
  open,
  onOpenChange,
  divisions,
  userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  divisions: DivisionOption[];
  userId: string | null;
}) {
  const queryClient = useQueryClient();
  const [division, setDivision] = useState("");
  const [role, setRole] = useState<string>("Anggota");
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  function pickDivision(value: string) {
    setDivision(value);
    setCode(generateDivisionCode(value));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!division) {
      toast.error("Divisi wajib dipilih");
      return;
    }
    const finalCode = (code || generateDivisionCode(division)).trim().toUpperCase();
    setSaving(true);
    const { error } = await supabase.from("invitations").insert({
      kind: "Kode_Divisi",
      code: finalCode,
      division,
      default_role: role,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expires || null,
      is_active: true,
      created_by: userId,
    });
    setSaving(false);
    if (error) {
      toast.error(
        error.message.includes("duplicate")
          ? "Kode sudah dipakai, ganti kode lain"
          : "Gagal membuat kode: " + error.message,
      );
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    toast.success("Kode divisi dibuat");
    setDivision("");
    setCode("");
    setMaxUses("");
    setExpires("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Kode Divisi</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Divisi</Label>
            <Select value={division} onValueChange={pickDivision}>
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
          </div>
          <div className="space-y-2">
            <Label>Role Default</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Kode</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FIN-2026-A3F"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Batas Pemakaian</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Kosong = tak terbatas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Berlaku Sampai</Label>
              <Input
                id="expires"
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Buat Kode"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PersonalLinkDialog({
  open,
  onOpenChange,
  divisions,
  userId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  divisions: DivisionOption[];
  userId: string | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [division, setDivision] = useState("");
  const [role, setRole] = useState<string>("Anggota");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!division) {
      toast.error("Divisi wajib dipilih");
      return;
    }
    const token = generatePersonalToken();
    setSaving(true);
    const { error } = await supabase.from("invitations").insert({
      kind: "Link_Personal",
      code: token,
      intended_name: name.trim() || null,
      intended_email: email.trim() || null,
      assigned_division: division,
      assigned_role: role,
      max_uses: 1,
      is_active: true,
      created_by: userId,
    });
    setSaving(false);
    if (error) {
      toast.error("Gagal membuat link: " + error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    try {
      await copyText(registerLink(token));
      toast.success("Link personal dibuat & disalin");
    } catch {
      toast.success("Link personal dibuat");
    }
    setName("");
    setEmail("");
    setDivision("");
    setRole("Anggota");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Link Personal</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pname">Nama Calon Anggota</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pemail">Email Calon</Label>
            <Input
              id="pemail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Divisi</Label>
            <Select value={division} onValueChange={setDivision}>
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
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Buat Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
