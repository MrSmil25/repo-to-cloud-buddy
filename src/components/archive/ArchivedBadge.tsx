export function ArchivedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground ${className}`}
    >
      Diarsipkan
    </span>
  );
}
