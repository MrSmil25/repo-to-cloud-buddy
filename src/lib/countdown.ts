export function remainingMs(expiresAt?: string | null) {
  if (!expiresAt) return null;
  return new Date(expiresAt).getTime() - Date.now();
}

/** Teks sisa waktu yang ramah dibaca, mis. "2 hari 4 jam lagi". */
export function formatRemaining(expiresAt?: string | null): string {
  const ms = remainingMs(expiresAt);
  if (ms === null) return "-";
  if (ms <= 0) return "Waktu habis";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
}

export function isUrgent(expiresAt?: string | null) {
  const ms = remainingMs(expiresAt);
  return ms !== null && ms < 24 * 3600 * 1000;
}
