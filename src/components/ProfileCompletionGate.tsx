import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-external";
import { useMyProfile, useDivisions, isSupervisor } from "@/hooks/useProfile";
import { claimInvite } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Pembungkus tambahan: memaksa anggota melengkapi profil (dan divisi bila ada
 * kode undangan) saat login pertama. Tidak memblokir halaman auth karena hanya
 * dipakai di dalam layout terproteksi.
 */
export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName((v) => v || profile.full_name || "");
      setNickname((v) => v || profile.nickname || "");
      setPhone((v) => v || profile.phone || "");
    }
  }, [profile]);

  const needsSetup =
    !!profile && !isSupervisor(profile.role) && (!profile.division || !profile.phone);

  if (isLoading || !needsSetup || skipped) return <>{children}</>;

  async function handleUpload(file: File) {
    if (!profile) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      await supabase.from("profiles").update({ photo_url: path }).eq("id", profile.id);
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Foto diunggah");
    } else {
      toast.error("Gagal mengunggah foto: " + uploadError.message);
    }
    setUploading(false);
  }

  async function handleClaim() {
    const value = code.trim();
    if (!value) {
      toast.error("Isi kode undangan dulu");
      return;
    }
    setClaiming(true);
    try {
      const result = await claimInvite(value);
      if (result === "OK") {
        await queryClient.invalidateQueries();
        toast.success("Divisi kamu berhasil diatur");
      } else {
        toast.error("Kode undangan tidak valid atau sudah tidak berlaku");
      }
    } catch {
      toast.error("Gagal memakai kode undangan");
    }
    setClaiming(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter");
      return;
    }
    if (phone.trim().length < 8) {
      toast.error("Nomor telepon wajib diisi");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Profil tersimpan");
    setSkipped(true);
  }

  const divisionName = divisions.find((d) => d.code === profile?.division)?.name;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold tracking-tight">Lengkapi Profil Kamu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sedikit lagi. Data ini dipakai untuk surat, tugas, dan koordinasi divisi.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gate-name">Nama Lengkap</Label>
            <Input
              id="gate-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gate-nick">Nickname</Label>
            <Input
              id="gate-nick"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nama panggilan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gate-phone">Nomor Telepon</Label>
            <Input
              id="gate-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gate-photo">Foto (opsional)</Label>
            <Input
              id="gate-photo"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            {uploading && <p className="text-xs text-muted-foreground">Mengunggah…</p>}
          </div>

          {profile?.division ? (
            <p className="rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-xs text-green-700">
              Divisi kamu: {divisionName ?? profile.division}
            </p>
          ) : (
            <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Divisi kamu belum diatur. Kalau kamu punya kode undangan, masukkan di sini:
              </p>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Kode undangan"
                />
                <Button type="button" variant="outline" onClick={handleClaim} disabled={claiming}>
                  {claiming ? "Memproses…" : "Pakai"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tidak punya kode? Hubungi Ketua untuk diatur divisinya — kamu tetap bisa lanjut.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan & Lanjut"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSkipped(true)}>
              Nanti saja
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
