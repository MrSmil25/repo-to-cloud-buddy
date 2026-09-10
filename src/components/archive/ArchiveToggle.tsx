import { Archive } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ArchiveToggle({
  checked,
  onCheckedChange,
  id = "archive-toggle",
  className = "",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 ${className}`}
    >
      <Archive className="size-3.5 text-muted-foreground" />
      <Label htmlFor={id} className="cursor-pointer text-xs font-medium text-muted-foreground">
        Tampilkan Arsip
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
