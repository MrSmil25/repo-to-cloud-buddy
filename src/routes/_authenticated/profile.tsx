import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-external";
import { useMyProfile, useDivisions } from "@/hooks/useProfile";
import { UserAvatar } from "@/components/UserAvatar";
import { invalidateAvatar } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil Saya — OrgTool" },
      { name: "description", content: "Kelola data profil anggota organisasi kampus kamu." },
      { property: "og:title", content: "Profil Saya — OrgTool" },
      {
        property: "og:description",
        content: "Kelola data profil anggota organisasi kampus kamu.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setNickname(profile.nickname ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const divisionName = divisions.find((d) => d.code === profile?.division)?.name;

  async function handleUpload(file: File) {
    if (!profile) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      setUploading(false);
      toast.error("Gagal mengunggah foto: " + uploadError.message);
      return;
    }
    const { error } = await supabase.from("profiles").update({ photo_url: path }).eq("id", profile.id);
    setUploading(false);
    if (error) {
      toast.error("Gagal menyimpan foto: " + error.message);
      return;
    }
    invalidateAvatar(profile.photo_url);
    await queryClient.invalidateQueries();
    toast.success("Foto profil diperbarui");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Perubahan disimpan");
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat profil…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">Perbarui informasi pribadi kamu.</p>
      </div>

      <div className="flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-sm">
        <UserAvatar
          path={profile?.photo_url}
          name={profile?.full_name}
          className="size-20 text-xl"
        />
        <div className="space-y-2">
          <p className="font-semibold">{profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent">
            {uploading ? "Mengunggah…" : "Ganti Foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              value={fullName}
              maxLength={100}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              maxLength={50}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nama panggilan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={profile?.role ?? "-"} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">Divisi</Label>
            <Input
              id="division"
              value={divisionName ?? "Belum ditentukan"}
              readOnly
              disabled
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Role dan Divisi hanya dapat diubah oleh Ketua atau Wakil Ketua.
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
}
