import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase-external";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Lupa Password — OrgTool" },
      { name: "description", content: "Kirim link reset password akun OrgTool kamu." },
      { property: "og:title", content: "Lupa Password — OrgTool" },
      { property: "og:description", content: "Kirim link reset password akun OrgTool kamu." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Gagal mengirim link reset");
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Lupa Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan email akun kamu untuk menerima link reset.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-card p-8 shadow-sm"
        >
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="rounded-lg border border-green-600/30 bg-green-600/10 p-3 text-sm text-green-700">
                Kalau email terdaftar, link reset sudah dikirim. Cek inbox kamu.
              </p>
              <p className="text-xs text-muted-foreground">
                Email belum masuk? Coba cek folder spam atau promosi.
              </p>
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@kampus.ac.id"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Kalau email tidak masuk dalam beberapa menit, cek folder spam.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Ingat passwordnya?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
