import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProfile } from "@/hooks/useProfile";
import {
  HIDEABLE_ROLES,
  canManageOrgSections,
  canManageSections,
  fetchSectionOverrides,
  fetchSectionSettings,
  isSectionVisible,
  setDivisionOverride,
  setHiddenRoles,
} from "@/lib/sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/sections")({
  head: () => ({
    meta: [
      { title: "Kelola Section Sidebar — OrgTool" },
      {
        name: "description",
        content: "Atur section sidebar mana yang terlihat untuk tiap role dan divisi.",
      },
      { property: "og:title", content: "Kelola Section Sidebar — OrgTool" },
      {
        property: "og:description",
        content: "Atur section sidebar mana yang terlihat untuk tiap role dan divisi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SectionsAdminPage,
});

function SectionsAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const allowed = canManageSections(profile?.role);
  const orgLevel = canManageOrgSections(profile?.role);
  const myDivision = (profile as { division?: string | null } | null | undefined)?.division ?? null;

  useEffect(() => {
    if (!profileLoading && profile && !allowed) {
      toast.error("Anda tidak punya akses ke halaman ini");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [profileLoading, profile, allowed, navigate]);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["section-settings"],
    queryFn: fetchSectionSettings,
    enabled: allowed,
  });
  const { data: overrides = [] } = useQuery({
    queryKey: ["section-overrides"],
    queryFn: fetchSectionOverrides,
    enabled: allowed,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["section-settings"] });
    queryClient.invalidateQueries({ queryKey: ["section-overrides"] });
  }

  async function toggleRole(sectionKey: string, role: string, hiddenRoles: string[]) {
    const next = hiddenRoles.includes(role)
      ? hiddenRoles.filter((r) => r !== role)
      : [...hiddenRoles, role];
    try {
      await setHiddenRoles(sectionKey, next);
      refresh();
      toast.success("Tersimpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  }

  async function changeOverride(sectionKey: string, value: "inherit" | "show" | "hide") {
    if (!myDivision) {
      toast.error("Divisi kamu belum diatur di profil.");
      return;
    }
    try {
      await setDivisionOverride(
        sectionKey,
        myDivision,
        value === "inherit" ? null : value === "hide",
      );
      refresh();
      toast.success("Tersimpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    }
  }

  if (!allowed) return null;

  const previewFor = (role: string) =>
    settings
      .filter((s) => isSectionVisible(s.section_key, { role, settings, overrides: [] }))
      .map((s) => s.label ?? s.section_key);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Section Sidebar</h1>
        <p className="text-sm text-muted-foreground">
          Sembunyikan section menu untuk role tertentu, atau timpa untuk divisimu.
        </p>
      </div>

      <Tabs defaultValue={orgLevel ? "org" : "division"}>
        <TabsList>
          {orgLevel && <TabsTrigger value="org">Pengaturan Organisasi</TabsTrigger>}
          <TabsTrigger value="division">Override Divisi Saya</TabsTrigger>
        </TabsList>

        {orgLevel && (
          <TabsContent value="org" className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sembunyikan section untuk role</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
                {settings.map((s) => {
                  const hidden = s.hidden_for_roles ?? [];
                  return (
                    <div key={s.section_key} className="rounded-lg border p-3">
                      <p className="text-sm font-semibold">{s.label ?? s.section_key}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {HIDEABLE_ROLES.map((role) => {
                          const isHidden = hidden.includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleRole(s.section_key, role, hidden)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                isHidden
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {role}
                              {isHidden ? " · disembunyikan" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Pratinjau sidebar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {HIDEABLE_ROLES.map((role) => (
                  <div key={role}>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{role}</p>
                    <p className="text-sm">{previewFor(role).join(", ") || "—"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="division" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Override untuk divisi {myDivision ?? "(belum diatur)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.map((s) => {
                const hidden = s.hidden_for_roles ?? [];
                const orgHidden = hidden.includes("Anggota");
                const ov = overrides.find(
                  (o) => o.section_key === s.section_key && o.division === myDivision,
                );
                const current: "inherit" | "show" | "hide" = !ov
                  ? "inherit"
                  : ov.is_hidden
                    ? "hide"
                    : "show";
                return (
                  <div
                    key={s.section_key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{s.label ?? s.section_key}</p>
                      <p className="text-xs text-muted-foreground">
                        Setting organisasi: {orgHidden ? "disembunyikan" : "tampil"} untuk Anggota
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(
                        [
                          ["inherit", "Ikut Organisasi"],
                          ["show", "Tampilkan"],
                          ["hide", "Sembunyikan"],
                        ] as const
                      ).map(([value, label]) => (
                        <Button
                          key={value}
                          size="sm"
                          variant={current === value ? "default" : "outline"}
                          onClick={() => changeOverride(s.section_key, value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
