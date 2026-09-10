import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-external";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchOrgSettings,
  resolveLogoUrl,
  updateOrgSettings,
  type OrgSettings,
} from "@/lib/announcements";

export const Route = createFileRoute("/_authenticated/settings/organization")({
  head: () => ({
    meta: [
      { title: "Pengaturan Organisasi — OrgTool" },
      { name: "description", content: "Atur identitas organisasi, kode surat, dan logo." },
      { property: "og:title", content: "Pengaturan Organisasi — OrgTool" },
      { property: "og:description", content: "Atur identitas organisasi, kode surat, dan logo." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile || !["Ketua", "Waketu", "Supervisor"].includes(profile.role)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OrgSettingsPage,
});

function OrgSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: fetchOrgSettings,
  });

  const [form, setForm] = useState<Partial<OrgSettings>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    let active = true;
    resolveLogoUrl(form.logo_url).then((url) => {
      if (active) setLogoPreview(url);
    });
    return () => {
      active = false;
    };
  }, [form.logo_url]);

  const save = useMutation({
    mutationFn: () =>
      updateOrgSettings({
        org_name: form.org_name ?? "",
        org_code: form.org_code ?? "",
        org_address: form.org_address ?? null,
        org_email: form.org_email ?? null,
        org_phone: form.org_phone ?? null,
        active_period: form.active_period ?? null,
        logo_url: form.logo_url ?? null,
      }),
    onSuccess: () => {
      toast.success("Pengaturan organisasi disimpan.");
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleLogo(file: File) {
    setUploading(true);
    const path = `org/logo-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm((prev) => ({ ...prev, logo_url: path }));
    toast.success("Logo terunggah. Jangan lupa simpan.");
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Building2 className="size-6 text-primary" /> Pengaturan Organisasi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identitas organisasi yang dipakai di seluruh aplikasi dan dokumen resmi.
        </p>
      </header>

      <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="org_name">Nama Organisasi</Label>
          <Input
            id="org_name"
            value={form.org_name ?? ""}
            onChange={(e) => setForm({ ...form, org_name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org_code">Kode Organisasi</Label>
          <Input
            id="org_code"
            value={form.org_code ?? ""}
            onChange={(e) => setForm({ ...form, org_code: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Kode ini dipakai di nomor surat, misal 001/FIN/RK/IX/2026. Ubah dengan hati-hati.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org_address">Alamat</Label>
          <Textarea
            id="org_address"
            rows={3}
            value={form.org_address ?? ""}
            onChange={(e) => setForm({ ...form, org_address: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="org_email">Email</Label>
            <Input
              id="org_email"
              type="email"
              value={form.org_email ?? ""}
              onChange={(e) => setForm({ ...form, org_email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org_phone">Telepon</Label>
            <Input
              id="org_phone"
              value={form.org_phone ?? ""}
              onChange={(e) => setForm({ ...form, org_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="active_period">Periode Aktif</Label>
          <Input
            id="active_period"
            placeholder="Kepengurusan 2026"
            value={form.active_period ?? ""}
            onChange={(e) => setForm({ ...form, active_period: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo Organisasi</Label>
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border bg-muted">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo organisasi" className="size-full object-contain" />
              ) : (
                <Building2 className="size-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogo(file);
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="logo" className="cursor-pointer">
                  <Upload className="size-4" />
                  {uploading ? "Mengunggah…" : "Unggah Logo"}
                </label>
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">PNG atau JPG, maksimal 2 MB.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
