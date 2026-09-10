import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OkrSnapshot } from "@/lib/command-center";
import { formatDateID } from "@/lib/format";

export function Momentum({ snapshots }: { snapshots: OkrSnapshot[] }) {
  const data = snapshots.map((s) => ({
    date: formatDateID(s.snapshot_date),
    progress: Number(s.objectives_avg_progress ?? 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Momentum</CardTitle>
        <CardDescription>
          Rata-rata progress Objective dari snapshot mingguan periode terpilih.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {data.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Grafik momentum akan muncul setelah minimal 2 snapshot mingguan terkumpul. Ambil
            snapshot pertama dengan tombol di atas.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="date"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, "Rata-rata progress"]} />
              <Line
                type="monotone"
                dataKey="progress"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
