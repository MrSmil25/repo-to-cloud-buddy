export function DivisionBadge({
  name,
  colorHex,
}: {
  name?: string | null | undefined;
  colorHex?: string | null | undefined;
}) {
  if (!name) {
    return <span className="text-xs text-muted-foreground">Belum ada divisi</span>;
  }
  const color = colorHex || "#1E3A8A";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {name}
    </span>
  );
}
