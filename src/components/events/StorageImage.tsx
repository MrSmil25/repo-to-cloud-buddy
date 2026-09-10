import { useQuery } from "@tanstack/react-query";
import { storageUrl } from "@/lib/events";

export function StorageImage({
  bucket,
  path,
  alt,
  className = "",
  fallback,
}: {
  bucket: string;
  path?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const { data: url } = useQuery({
    queryKey: ["storage-url", bucket, path],
    queryFn: () => storageUrl(bucket, path),
    enabled: !!path,
  });

  if (!path || !url) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className}`}
      >
        {fallback ?? "Tanpa gambar"}
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
