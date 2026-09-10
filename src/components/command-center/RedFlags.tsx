import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  FileSignature,
  Handshake,
  ListChecks,
  Target,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RedFlag } from "@/lib/command-center";

const ICONS: Record<string, typeof AlertTriangle> = {
  "Key Result": Target,
  Task: ListChecks,
  Deal: Handshake,
  Anggaran: Wallet,
  MoU: FileSignature,
  "Pengajuan Dana": CircleDollarSign,
  Event: CalendarClock,
};

export function RedFlags({ flags }: { flags: RedFlag[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          Butuh Perhatian
        </CardTitle>
        <CardDescription>Item bermasalah lintas modul, paling mendesak di atas.</CardDescription>
      </CardHeader>
      <CardContent>
        {flags.length === 0 ? (
          <p className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            ✅ Tidak ada yang perlu perhatian mendesak saat ini.
          </p>
        ) : (
          <ul className="divide-y">
            {flags.map((flag) => {
              const Icon = ICONS[flag.category] ?? AlertTriangle;
              return (
                <li key={flag.id}>
                  <Link
                    to={flag.link?.to ?? "/dashboard"}
                    className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="mt-0.5 rounded-md bg-muted p-1.5">
                      <Icon className="size-4 text-foreground/70" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{flag.title}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {flag.category}
                        </span>
                        {flag.division && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                            {flag.division}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {flag.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
