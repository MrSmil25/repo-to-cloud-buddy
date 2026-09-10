import { supabase } from "@/lib/supabase-external";

const cache = new Map<string, string>();

/** Menghasilkan URL bertanda tangan untuk foto profil di bucket privat "avatars". */
export async function getAvatarUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cached = cache.get(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}

export function invalidateAvatar(path?: string | null) {
  if (path) cache.delete(path);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
