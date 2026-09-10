import { supabase } from "@/lib/supabase-external";

/**
 * Tabel budgets belum sepenuhnya tercakup di tipe hasil generate (kolom
 * parent_budget_id & created_by), jadi diakses lewat klien tanpa tipe.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export type BudgetRow = {
  id: string;
  period: string;
  division: string | null;
  category: string;
  allocated_idr: number;
  spent_idr: number | null;
  status: string;
  notes: string | null;
  event_id: string | null;
  parent_budget_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BudgetNode = BudgetRow & {
  children: BudgetRow[];
  allocatedChildren: number;
  unallocated: number;
  spentChildren: number;
};

const FIELDS =
  "id,period,division,category,allocated_idr,spent_idr,status,notes,event_id,parent_budget_id,created_by,created_at,updated_at";

export async function fetchBudgets(): Promise<BudgetRow[]> {
  const { data, error } = await db
    .from("budgets")
    .select(FIELDS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BudgetRow[];
}

export function buildBudgetTree(rows: BudgetRow[]): BudgetNode[] {
  const parents = rows.filter((r) => !r.parent_budget_id);
  return parents.map((parent) => {
    const children = rows.filter((r) => r.parent_budget_id === parent.id);
    const allocatedChildren = children.reduce((s, c) => s + Number(c.allocated_idr ?? 0), 0);
    const spentChildren = children.reduce((s, c) => s + Number(c.spent_idr ?? 0), 0);
    return {
      ...parent,
      children,
      allocatedChildren,
      spentChildren,
      unallocated: Math.max(0, Number(parent.allocated_idr ?? 0) - allocatedChildren),
    };
  });
}

export type BudgetInput = {
  period: string;
  category: string;
  division: string | null;
  event_id?: string | null;
  allocated_idr: number;
  notes: string | null;
  parent_budget_id: string | null;
};

export async function createBudget(input: BudgetInput): Promise<BudgetRow> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("budgets")
    .insert({
      ...input,
      spent_idr: 0,
      status: "On_Budget",
      created_by: userData.user?.id ?? null,
    })
    .select(FIELDS)
    .single();
  if (error) throw error;
  return data as BudgetRow;
}

export async function updateBudget(
  id: string,
  patch: Partial<BudgetInput>,
): Promise<BudgetRow> {
  const { data, error } = await db.from("budgets").update(patch).eq("id", id).select(FIELDS).single();
  if (error) throw error;
  return data as BudgetRow;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await db.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

/** Ambil pesan asli dari Supabase/Postgres supaya aturan jatah induk terbaca user. */
export function supabaseErrorMessage(error: unknown): string {
  const e = error as { message?: string; details?: string; hint?: string } | null;
  return (
    e?.message?.trim() ||
    e?.details?.trim() ||
    e?.hint?.trim() ||
    "Terjadi kesalahan yang tidak diketahui."
  );
}

export function canManageParentBudget(role?: string | null): boolean {
  return !!role && ["Ketua", "Waketu", "Controller", "Supervisor"].includes(role);
}

export function canManageSubBudget(
  role: string | null | undefined,
  myDivision: string | null | undefined,
  parentDivision: string | null | undefined,
  subDivision?: string | null,
): boolean {
  if (canManageParentBudget(role)) return true;
  if (role !== "Kadiv" || !myDivision) return false;
  const target = subDivision ?? parentDivision ?? null;
  // Kadiv boleh memecah sub-pos di induk milik divisinya (atau induk organisasi).
  if (subDivision) return subDivision === myDivision;
  return !target || target === myDivision;
}

export const BUDGET_STATUS_META: Record<string, { label: string; className: string }> = {
  On_Budget: { label: "Aman", className: "bg-emerald-100 text-emerald-800" },
  Warning: { label: "Mendekati Batas", className: "bg-amber-100 text-amber-800" },
  Over_Budget: { label: "Melebihi Anggaran", className: "bg-red-100 text-red-800" },
};

export function budgetProgress(spent: number, allocated: number): number {
  if (!allocated) return 0;
  return Math.min(100, Math.round((spent / allocated) * 100));
}
