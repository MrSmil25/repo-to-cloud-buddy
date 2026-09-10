import { useState, type ReactNode } from "react";
import { Archive, MoreVertical, Undo2 } from "lucide-react";
import { useMyProfile } from "@/hooks/useProfile";
import { canArchive, canRestore, type ArchivableTable } from "@/lib/archive";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArchiveConfirmModal, type ArchiveModalMode } from "./ArchiveConfirmModal";

/**
 * Menu titik-tiga berisi aksi Arsipkan / Pulihkan.
 * Hanya menambah aksi — tidak mengubah aksi lain yang sudah ada
 * (bisa disisipkan lewat prop `children`).
 */
export function ArchiveMenu({
  table,
  recordId,
  recordName,
  isArchived,
  itemDivision,
  extraWarning,
  invalidateKeys = [],
  children,
  className = "",
}: {
  table: ArchivableTable;
  recordId: string;
  recordName: string;
  isArchived?: boolean | null;
  itemDivision?: string | null;
  extraWarning?: string;
  invalidateKeys?: string[];
  children?: ReactNode;
  className?: string;
}) {
  const { data: profile } = useMyProfile();
  const [mode, setMode] = useState<ArchiveModalMode | null>(null);

  const showArchive = !isArchived && canArchive(profile?.role, profile?.division, table, itemDivision);
  const showRestore = !!isArchived && canRestore(profile?.role);

  if (!children && !showArchive && !showRestore) return null;

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi lainnya">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {children}
          {showArchive && (
            <DropdownMenuItem className="text-muted-foreground" onSelect={() => setMode("archive")}>
              <Archive className="size-4" /> Arsipkan
            </DropdownMenuItem>
          )}
          {showRestore && (
            <DropdownMenuItem onSelect={() => setMode("restore")}>
              <Undo2 className="size-4" /> Pulihkan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {mode && (
        <ArchiveConfirmModal
          open
          onOpenChange={(v) => !v && setMode(null)}
          mode={mode}
          table={table}
          recordId={recordId}
          recordName={recordName}
          extraWarning={extraWarning}
          invalidateKeys={invalidateKeys}
        />
      )}
    </div>
  );
}
