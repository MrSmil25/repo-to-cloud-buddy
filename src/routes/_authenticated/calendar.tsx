import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDivisions, useMyProfile, isBPH } from "@/hooks/useProfile";
import {
  fetchCalendarItems,
  itemDates,
  relativeDayLabel,
  toISODate,
  TYPE_DOT,
  TYPE_LABEL,
  type CalendarItem,
  type CalendarItemType,
} from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Kalender Terpadu | OrgTool" },
      {
        name: "description",
        content:
          "Satu kalender untuk event, tenggat task, jatuh tempo key result, masa berlaku MoU, dan jadwal rapat organisasi.",
      },
      { property: "og:title", content: "Kalender Terpadu" },
      {
        property: "og:description",
        content: "Event, tenggat task, key result, MoU, dan rapat dalam satu kalender.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const ALL_TYPES: CalendarItemType[] = ["event", "task", "kr", "mou", "meeting"];
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  format(new Date(2024, i, 1), "MMMM", { locale: idLocale }),
);

function CalendarPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions } = useDivisions();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<"bulan" | "agenda">(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "agenda" : "bulan",
  );
  const [types, setTypes] = useState<CalendarItemType[]>(ALL_TYPES);
  const [division, setDivision] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const canFilterDivision = isBPH(profile?.role) || profile?.role === "Kadiv";

  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const rangeFrom = addMonths(gridStart, -1);
  const rangeTo = addMonths(gridEnd, 2);

  const { data: items, isLoading } = useQuery({
    queryKey: ["calendar", toISODate(rangeFrom), toISODate(rangeTo), profile?.id],
    queryFn: () => fetchCalendarItems(rangeFrom, rangeTo, profile?.id),
    enabled: !!profile,
  });

  const filtered = useMemo(() => {
    return (items ?? []).filter((it) => {
      if (!types.includes(it.type)) return false;
      if (canFilterDivision && division !== "all" && it.division !== division) return false;
      if (onlyMine && it.ownerId !== profile?.id) return false;
      return true;
    });
  }, [items, types, division, onlyMine, profile?.id, canFilterDivision]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of filtered) {
      for (const d of itemDates(it)) {
        const list = map.get(d) ?? [];
        list.push(it);
        map.set(d, list);
      }
    }
    return map;
  }, [filtered]);

  const todayISO = toISODate(new Date());

  const upcoming = useMemo(
    () =>
      filtered
        .filter((it) => !it.done && (it.endDate ?? it.date) >= todayISO)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [filtered, todayISO],
  );

  const overdue = useMemo(
    () => filtered.filter((it) => !it.done && it.date < todayISO && it.type !== "event"),
    [filtered, todayISO],
  );

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = new Date(d.getTime() + 86_400_000)) days.push(d);

  function toggleType(t: CalendarItemType) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kalender Terpadu</h1>
          <p className="text-sm text-muted-foreground">
            Event, tenggat task, key result, MoU, dan rapat dalam satu tampilan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "bulan" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("bulan")}
          >
            <LayoutGrid className="size-4" /> Bulan
          </Button>
          <Button
            variant={view === "agenda" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("agenda")}
          >
            <List className="size-4" /> Agenda
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {ALL_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox checked={types.includes(t)} onCheckedChange={() => toggleType(t)} />
                <span className={`size-2.5 rounded-full ${TYPE_DOT[t]}`} />
                {TYPE_LABEL[t]}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={onlyMine} onCheckedChange={(c) => setOnlyMine(c === true)} />
            Hanya milik saya
          </label>
          {canFilterDivision && (
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua divisi</SelectItem>
                {(divisions ?? []).map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {view === "bulan" ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Bulan sebelumnya"
                      onClick={() => setCursor((c) => addMonths(c, -1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Bulan berikutnya"
                      onClick={() => setCursor((c) => addMonths(c, 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCursor(startOfMonth(new Date()))}
                    >
                      Hari Ini
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={String(cursor.getMonth())}
                      onValueChange={(v) =>
                        setCursor((c) => new Date(c.getFullYear(), Number(v), 1))
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(cursor.getFullYear())}
                      onValueChange={(v) => setCursor((c) => new Date(Number(v), c.getMonth(), 1))}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map(
                          (y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading ? (
                  <Skeleton className="h-[520px] w-full" />
                ) : (
                  <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border">
                    {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                      <div
                        key={d}
                        className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground"
                      >
                        {d}
                      </div>
                    ))}
                    {days.map((d) => {
                      const iso = toISODate(d);
                      const list = byDate.get(iso) ?? [];
                      const isToday = iso === todayISO;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setSelected(iso)}
                          className={`min-h-[104px] bg-card p-1.5 text-left align-top transition-colors hover:bg-accent ${
                            isSameMonth(d, cursor) ? "" : "opacity-50"
                          }`}
                        >
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                              isToday ? "bg-primary text-primary-foreground" : ""
                            }`}
                          >
                            {d.getDate()}
                          </span>
                          <div className="mt-1 space-y-1">
                            {list.slice(0, 3).map((it) => (
                              <span
                                key={it.id + iso}
                                className={`block truncate rounded px-1.5 py-0.5 text-[11px] ${it.color}`}
                              >
                                {it.title}
                              </span>
                            ))}
                            {list.length > 3 && (
                              <span className="block px-1 text-[11px] text-muted-foreground">
                                +{list.length - 3} lainnya
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <AgendaView items={filtered} isLoading={isLoading} />
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mendatang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdue.length > 0 && (
                <p className="rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
                  {overdue.length} item sudah lewat tenggat.
                </p>
              )}
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada agenda terdekat.</p>
              ) : (
                upcoming.map((it) => <ItemRow key={it.id} item={it} />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selected
                ? format(new Date(`${selected}T00:00:00`), "EEEE, dd MMMM yyyy", {
                    locale: idLocale,
                  })
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 p-4">
            {(selected ? (byDate.get(selected) ?? []) : []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada agenda di tanggal ini.</p>
            ) : (
              (selected ? (byDate.get(selected) ?? []) : []).map((it) => (
                <ItemRow key={it.id} item={it} />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ItemRow({ item }: { item: CalendarItem }) {
  const body = (
    <div className="flex items-start gap-2 rounded-md border p-2.5 transition-colors hover:bg-accent">
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${item.dotColor}`} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {TYPE_LABEL[item.type]}
          {item.time ? ` · ${item.time}` : ""} · {relativeDayLabel(item.date)}
        </p>
      </div>
    </div>
  );
  if (!item.link) return body;
  return item.link.params ? (
    <Link to={item.link.to as "/meetings/$id"} params={item.link.params as { id: string }}>
      {body}
    </Link>
  ) : (
    <Link to={item.link.to as "/workspace"}>{body}</Link>
  );
}

function AgendaView({ items, isLoading }: { items: CalendarItem[]; isLoading: boolean }) {
  const todayISO = toISODate(new Date());
  const limitISO = toISODate(new Date(Date.now() + 30 * 86_400_000));

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      for (const d of itemDates(it)) {
        if (d < todayISO || d > limitISO) continue;
        const list = map.get(d) ?? [];
        list.push(it);
        map.set(d, list);
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, todayISO, limitISO]);

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (grouped.length === 0)
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 size-6" />
          Tidak ada agenda dalam 30 hari ke depan.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      {grouped.map(([date, list]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-sm">
              {format(new Date(`${date}T00:00:00`), "EEEE, dd MMM yyyy", { locale: idLocale })}
              <span className="ml-2 font-normal text-muted-foreground">
                ({relativeDayLabel(date)})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.map((it) => (
              <ItemRow key={it.id + date} item={it} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
