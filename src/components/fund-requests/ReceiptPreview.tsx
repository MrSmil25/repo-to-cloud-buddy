import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink } from "lucide-react";
import { resolveDocUrl, isPdfPath } from "@/lib/fund-requests";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  path?: string | null;
  className?: string;
  label?: string;
};

export function ReceiptPreview({ path, className, label = "Struk / Bukti" }: Props) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["doc-url", path],
    queryFn: () => resolveDocUrl(path),
    enabled: !!path,
  });

  if (!path) {
    return <p className="text-sm text-muted-foreground">Belum ada {label.toLowerCase()}.</p>;
  }
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!url) return <p className="text-sm text-muted-foreground">Bukti tidak dapat dibuka.</p>;

  if (isPdfPath(path)) {
    return (
      <div className={className}>
        <object data={url} type="application/pdf" className="h-72 w-full rounded-lg border">
          <p className="p-4 text-sm">Pratinjau PDF tidak tersedia.</p>
        </object>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <FileText className="size-4" /> Buka {label} (PDF)
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={label}
          className="max-h-96 w-full rounded-lg border object-contain bg-muted"
        />
      </a>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Lihat ukuran penuh <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
