import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-external";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { claimInvite, validateInvite, type ValidateInviteResult } from "@/lib/invitations";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar — OrgTool" },
      { name: "description", content: "Buat akun OrgTool untuk anggota organisasi kampus." },
      { property: "og:title", content: "Daftar — OrgTool" },
      {
        property: "og:description",
        content: "Buat akun OrgTool untuk anggota organisasi kampus.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { code?: string } =>
    typeof search['code'] === "string" ? { code: search['code'] as string } : {},
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { code: codeParam } = Route.useSearch();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState(codeParam ?? "");
  const [checking, setChecking] = useState(false);
  const [invite, setInvite] = useState<ValidateInviteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const lockedCode = !!codeParam;

  useEffect(() => {
    const code = inviteCode.trim();
    if (!code) {
      setInvite(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await validateInvite(code);
        if (!cancelled) setInvite(result);
      } catch {
        if (!cancelled)
          setInvite({
            valid: false,
            message: "Kode undangan tidak dapat diperiksa",
            division: null,
            role: null,
            intended_email: null,
          });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inviteCode]);

  const inviteInvalid = !!inviteCode.trim() && !!invite && !invite.valid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter");
      return;
    }
    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    if (inviteInvalid) {
      toast.error(invite?.message || "Kode undangan tidak valid");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Gagal mendaftar");
      return;
    }

    let hasSession = !!data.session;
    if (!hasSession) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setLoading(false);
        toast.success("Akun dibuat. Silakan cek email untuk konfirmasi, lalu masuk.");
        navigate({ to: "/login", replace: true });
        return;
      }
      hasSession = true;
    }

    const code = inviteCode.trim();
    if (code && hasSession) {
      try {
        const result = await claimInvite(code);
        if (result === "OK") {
          toast.success("Undangan diterima, divisi & role sudah diatur");
        } else {
          toast.warning(
            "Kode undangan tidak dapat dipakai. Kamu masuk sebagai Anggota tanpa divisi.",
          );
        }
      } catch {
        toast.warning("Gagal memakai kode undangan. Kamu masuk sebagai Anggota tanpa divisi.");
      }
    }

    setLoading(false);
    toast.success("Pendaftaran berhasil");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            O
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">OrgTool</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buat akun anggota baru</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-card p-8 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap kamu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@kampus.ac.id"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Kode Undangan (opsional)</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              readOnly={lockedCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Misal FIN-2026-A3F"
              className={lockedCode ? "bg-muted" : undefined}
            />
            {checking && <p className="text-xs text-muted-foreground">Memeriksa kode…</p>}
            {!checking && invite?.valid && (
              <div className="rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-xs text-green-700">
                <p className="font-medium">
                  Kamu akan bergabung ke divisi {invite.division ?? "-"} sebagai{" "}
                  {invite.role ?? "Anggota"}.
                </p>
                {invite.intended_email && (
                  <p className="mt-1">Sebaiknya daftar dengan email {invite.intended_email}.</p>
                )}
              </div>
            )}
            {!checking && inviteInvalid && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {invite?.message || "Kode undangan tidak valid"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi kata sandi"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tanpa kode undangan, role kamu otomatis menjadi <strong>Anggota</strong> dan divisi
            akan diisi kemudian oleh Ketua atau Wakil Ketua.
          </p>
          <Button type="submit" className="w-full" disabled={loading || inviteInvalid}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
