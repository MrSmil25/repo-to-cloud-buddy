import { supabase } from "@/lib/supabase-external";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as unknown as { from: (table: string) => any };

export type OriginMaps = {
  people: Record<string, { full_name: string; role: string | null }>;
  events: Record<string, string>;
};

export async function fetchOriginMaps(): Promise<OriginMaps> {
  const [people, events] = await Promise.all([
    db.from("profiles").select("id,full_name,role"),
    db.from("events").select("id,name"),
  ]);
  const p: OriginMaps["people"] = {};
  for (const row of (people.data ?? []) as any[]) {
    p[row.id] = { full_name: row.full_name, role: row.role ?? null };
  }
  const e: OriginMaps["events"] = {};
  for (const row of (events.data ?? []) as any[]) e[row.id] = row.name;
  return { people: p, events: e };
}

export type OriginInfo = { label: string; className: string; icon: "target" | "none" };

export function originChip(
  task: {
    origin_type?: string | null;
    origin_note?: string | null;
    created_by?: string | null;
    related_event_id?: string | null;
  },
  maps?: OriginMaps,
): OriginInfo | null {
  const type = task.origin_type ?? "Sendiri";
  const creator = task.created_by ? maps?.people[task.created_by] : undefined;
  const creatorName = creator?.full_name ?? "seseorang";

  switch (type) {
    case "Dari_Atasan":
      return {
        label: `Dari ${creatorName}${creator?.role ? ` (${creator.role})` : ""}`,
        className: "bg-sky-100 text-sky-700",
        icon: "none",
      };
    case "Dari_Rekan":
      return {
        label: `Dari ${creatorName}`,
        className: "bg-purple-100 text-purple-700",
        icon: "none",
      };
    case "Dari_Event_PIC": {
      const eventName =
        (task.related_event_id ? maps?.events[task.related_event_id] : undefined) ??
        task.origin_note ??
        "event";
      return {
        label: `Untuk event: ${eventName}`,
        className: "bg-indigo-100 text-indigo-700",
        icon: "target",
      };
    }
    case "Dari_Request":
      return {
        label: `Request dari ${task.origin_note ?? "divisi lain"}`,
        className: "bg-emerald-100 text-emerald-700",
        icon: "none",
      };
    case "Dari_Rapat":
      return {
        label: `Dari rapat: ${task.origin_note ?? "rapat"}`,
        className: "bg-orange-100 text-orange-700",
        icon: "none",
      };
    default:
      return null;
  }
}
