import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-external";
import { useDivisions, useMyProfile, useProfiles, isBPH, type Profile } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { DivisionBadge } from "@/components/DivisionBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import type { Database } from "@/lib/db-types";

type UserRole = Database["public"]["Enums"]["user_role"];

const ROLES: UserRole[] = [
  "Anggota",
  "Kadiv",
  "Waketu",
  "Ketua",
  "Sekretaris",
  "Controller",
  "Supervisor",
];

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Anggota — OrgTool" },
      { name: "description", content: "Daftar seluruh anggota organisasi beserta divisi dan role." },
      { property: "og:title", content: "Anggota — OrgTool" },
      {
        property: "og:description",
        content: "Daftar seluruh anggota organisasi beserta divisi dan role.",
      },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const { data: me } = useMyProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("Anggota");
  const [division, setDivision] = useState<string>("none");
  const [saving, setSaving] = useState(false);

  const canEdit = isBPH(me?.role);

  const filtered = useMemo(
    () =>
      profiles.filter((p) =>
        (p.full_name ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [profiles, search],
  );

  function openEdit(p: Profile) {
    setEditing(p);
    setRole(p.role);
    setDivision(p.division ?? "none");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        division: division === "none" ? null : division,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    await queryClient.invalidateQueries();
    setEditing(null);
    toast.success("Data anggota diperbarui");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anggota</h1>
          <p className="text-sm text-muted-foreground">
            {profiles.length} anggota terdaftar di organisasi.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {canEdit && (
            <Button asChild variant="outline">
              <Link to="/invitations">Undang Anggota</Link>
            </Button>
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota…"
            className="sm:max-w-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Divisi</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
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
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada anggota yang cocok.
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const div = divisions.find((d) => d.code === p.division);
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <UserAvatar path={p.photo_url} name={p.full_name} className="size-9" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.full_name}</p>
                    {p.nickname && <p className="text-xs text-muted-foreground">{p.nickname}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <DivisionBadge name={div?.name} colorHex={div?.color_hex} />
                  </td>
                  <td className="px-4 py-3">{p.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "Active"
                          ? "rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role &amp; Divisi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{editing?.full_name}</p>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const next = v as UserRole;
                  setRole(next);
                  if (next === "Supervisor") setDivision("none");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Divisi</Label>
              <Select
                value={division}
                onValueChange={setDivision}
                disabled={role === "Supervisor"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belum ditentukan</SelectItem>
                  {divisions.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {role === "Supervisor" && (
                <p className="text-xs text-muted-foreground">
                  Pembina tidak berdivisi — posisinya berada di atas seluruh divisi.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
