import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  Target,
  Wallet,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import type { ActivityItem } from "@/lib/command-center";

const ICONS: Record<string, typeof Activity> = {
  kr: Target,
  deal: Handshake,
  finance: Wallet,
  task: CheckCircle2,
  event: CalendarDays,
  letter: FileText,
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>10 pergerakan terakhir lintas modul.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const Icon = ICONS[item.kind] ?? Activity;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-muted p-1.5">
                    <Icon className="size-4 text-foreground/70" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(item.at)}
                      {item.division ? ` · ${item.division}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
