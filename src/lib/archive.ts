import { supabase } from "@/lib/supabase-external";

export type ArchivableTable =
  | "deals"
  | "companies"
  | "people"
  | "collections"
  | "fund_transactions"
  | "cash_expenses"
  | "speakers"
  | "events"
  | "mous";

export const ARCHIVE_LABELS: Record<ArchivableTable, string> = {
  deals: "Deal",
  companies: "Perusahaan",
  people: "Kontak",
  collections: "Program Iuran",
  fund_transactions: "Transaksi",
  cash_expenses: "Pengeluaran Kas",
  speakers: "Speaker",
  events: "Event",
  mous: "MoU",
};

const BPH_ROLES = ["Ketua", "Waketu", "Supervisor"];
const FINANCE_TABLES: ArchivableTable[] = ["fund_transactions", "cash_expenses", "collections"];

export function isBphRole(role?: string | null) {
  return !!role && BPH_ROLES.includes(role);
}

/** Pre-filter tampilan tombol arsip. Wewenang sebenarnya tetap dicek fungsi DB. */
export function canArchive(
  role: string | null | undefined,
  myDivision: string | null | undefined,
  table: ArchivableTable,
  itemDivision?: string | null,
) {
  if (!role) return false;
  if (isBphRole(role)) return true;
  if (table === "mous") return false; // hanya BPH/Supervisor
  if (FINANCE_TABLES.includes(table)) return role === "Controller";
  if (role === "Controller") return false;
  if (role === "Kadiv") {
    if (!itemDivision) return true;
    return itemDivision === myDivision;
  }
  return false;
}

export function canRestore(role?: string | null) {
  return isBphRole(role);
}

export async function archiveRecord(table: ArchivableTable, id: string, reason?: string) {
  const { data, error } = await supabase.rpc("archive_record", {
    p_table: table,
    p_record_id: id,
    p_reason: reason?.trim() ? reason.trim() : null,
  } as never);
  if (error) throw error;
  return data as unknown as string;
}

export async function restoreRecord(table: ArchivableTable, id: string) {
  const { data, error } = await supabase.rpc("restore_record", {
    p_table: table,
    p_record_id: id,
  } as never);
  if (error) throw error;
  return data as unknown as string;
}

export type ArchivedFields = {
  is_archived?: boolean | null;
  archived_by?: string | null;
  archived_at?: string | null;
  archive_reason?: string | null;
};

export const archivedRowClass = (archived?: boolean | null) =>
  archived ? "opacity-50" : "";

export const archivedTitleClass = (archived?: boolean | null) =>
  archived ? "line-through opacity-60" : "";
