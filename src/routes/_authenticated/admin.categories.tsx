import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMyProfile } from "@/hooks/useProfile";
import {
  CATEGORY_TYPE_META,
  canManageCategories,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type TransactionCategory,
} from "@/lib/transactions";
import { CategoryFormDialog } from "@/components/transactions/CategoryFormDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Kelola Kategori — OrgTool" },
      { name: "description", content: "Kelola kategori transaksi keuangan organisasi." },
      { property: "og:title", content: "Kelola Kategori — OrgTool" },
      { property: "og:description", content: "Kelola kategori transaksi keuangan organisasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const allowed = canManageCategories(profile?.role);

  useEffect(() => {
    if (!profileLoading && profile && !allowed) {
      toast.error("Anda tidak punya akses ke halaman ini");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [profileLoading, profile, allowed, navigate]);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["transaction-categories", "all"],
    queryFn: () => fetchCategories(false),
    enabled: allowed,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionCategory | null>(null);
  const [deleting, setDeleting] = useState<TransactionCategory | null>(null);

  const nextOrder = categories.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0) + 1;

  async function toggleActive(c: TransactionCategory, v: boolean) {
    try {
      await updateCategory(c.id, { is_active: v });
      await queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
    } catch (e) {
      toast.error("Gagal memperbarui: " + (e as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCategory(deleting.id);
      await queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast.success("Kategori dihapus");
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Kategori</h1>
          <p className="text-sm text-muted-foreground">Kategori untuk pencatatan transaksi keuangan.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Warna</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Aktif</th>
              <th className="px-4 py-3">Urutan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat…</td></tr>
            )}
            {!isLoading && categories.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Belum ada kategori.</td></tr>
            )}
            {categories.map((c) => {
              const meta = CATEGORY_TYPE_META[c.type] ?? { label: c.type, className: "bg-sky-100 text-sky-700" };
              return (
                <tr key={c.id} className={c.is_active === false ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block size-4 rounded-full border"
                      style={{ backgroundColor: c.color_hex ?? "#94a3b8" }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={c.is_active !== false}
                      onCheckedChange={(v) => toggleActive(c, v)}
                      aria-label={`Aktifkan ${c.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.sort_order ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(c);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label="Hapus"
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        nextOrder={nextOrder}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi lama yang memakai nama kategori ini tetap tersimpan. Pertimbangkan menonaktifkan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
