import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Radar,
  User,
  Users,
  Boxes,
  LogOut,
  Menu,
  X,
  Megaphone,
  Settings,
  BriefcaseBusiness,
  TrendingUp,
  Wallet,
  ShieldCheck,
  NotebookPen,
  CalendarDays,
  PiggyBank,
  GraduationCap,
  ClipboardList,
  Building2,
  KanbanSquare,
  FileSignature,
  Receipt,
  Tags,
  Mic,
  MailPlus,
  BookOpen,
  AlertTriangle,
  Vote,
  PieChart,
  LifeBuoy,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-external";
import { isBPH, isSupervisor, useMyProfile } from "@/hooks/useProfile";
import { usePendingAssignmentCount } from "@/hooks/useAssignments";
import { canApproveFunds } from "@/lib/fund-requests";
import { canManageCategories } from "@/lib/transactions";
import { fetchOrgSettings, resolveLogoUrl } from "@/lib/announcements";
import {
  canManageSections,
  fetchSectionOverrides,
  fetchSectionSettings,
  isSectionVisible,
} from "@/lib/sections";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AppLayout,
});

const STORAGE_KEY = "sidebar-sections-state";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  requires?: "categoryAdmin" | "orgAdmin" | "fundApprover" | "supervisor" | "sectionAdmin";
};

type NavSection = { key: string; label: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    key: "UTAMA",
    label: "UTAMA",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/workspace", label: "Ruang Kerja Saya", icon: BriefcaseBusiness },
      { to: "/help-requests", label: "Request Bantuan", icon: LifeBuoy },
      { to: "/calendar", label: "Kalender", icon: CalendarDays },
      { to: "/mentor-tasks", label: "Tugas dari Pembina", icon: GraduationCap },
    ],
  },
  {
    key: "KOMUNIKASI",
    label: "KOMUNIKASI",
    items: [{ to: "/announcements", label: "Pengumuman", icon: Megaphone }],
  },
  {
    key: "KEUANGAN",
    label: "KEUANGAN",
    items: [
      { to: "/finance-summary", label: "Ringkasan Keuangan", icon: PieChart },
      { to: "/fund-requests", label: "Pengajuan Dana", icon: Wallet },
      { to: "/fund-approvals", label: "Approval Dana", icon: ShieldCheck, requires: "fundApprover" },
      { to: "/budgets", label: "Anggaran", icon: PiggyBank },
      { to: "/transactions", label: "Feed Keuangan", icon: Receipt },
      { to: "/admin/categories", label: "Kelola Kategori", icon: Tags, requires: "categoryAdmin" },
    ],
  },
  {
    key: "KAS",
    label: "KAS",
    items: [{ to: "/cash", label: "Kas & Iuran", icon: PiggyBank }],
  },
  {
    key: "STRATEGI",
    label: "STRATEGI",
    items: [
      { to: "/command-center", label: "Command Center", icon: Radar },
      { to: "/member-progress", label: "Progres Anggota", icon: TrendingUp },
    ],
  },
  {
    key: "EKSTERNAL",
    label: "EKSTERNAL",
    items: [
      { to: "/companies", label: "Perusahaan", icon: Building2 },
      { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
      { to: "/mous", label: "MoU", icon: FileSignature },
    ],
  },
  {
    key: "EVENT",
    label: "EVENT",
    items: [
      { to: "/events", label: "Events", icon: CalendarDays },
      { to: "/speakers", label: "Speaker", icon: Mic },
    ],
  },
  {
    key: "ORGANISASI",
    label: "ORGANISASI",
    items: [
      { to: "/profile", label: "Profil Saya", icon: User },
      { to: "/members", label: "Anggota", icon: Users },
      { to: "/divisions", label: "Divisi", icon: Boxes },
      { to: "/meetings", label: "Rapat", icon: NotebookPen },
      { to: "/invitations", label: "Undangan", icon: MailPlus, requires: "orgAdmin" },
      { to: "/settings/organization", label: "Pengaturan", icon: Settings, requires: "orgAdmin" },
      {
        to: "/admin/sections",
        label: "Kelola Section",
        icon: SlidersHorizontal,
        requires: "sectionAdmin",
      },
      { to: "/guide", label: "Panduan", icon: BookOpen },
    ],
  },
  {
    key: "HR_KINERJA",
    label: "HR & KINERJA",
    items: [
      { to: "/reports/member", label: "Rapor Anggota", icon: ClipboardList },
      { to: "/reports/workload", label: "Peta Beban Kerja", icon: TrendingUp },
      { to: "/reports/blockers", label: "Pelacak Penyumbat", icon: ShieldCheck },
      { to: "/reports/holdings", label: "Serah Terima", icon: Boxes },
      { to: "/coaching", label: "Catatan Bimbingan", icon: NotebookPen },
      { to: "/contributions", label: "Kontribusi", icon: Megaphone },
      { to: "/warnings", label: "Peringatan (SP)", icon: AlertTriangle },
      { to: "/warnings/proposals", label: "Usulan Peringatan", icon: Vote },
    ],
  },
  {
    key: "PEMBINA",
    label: "PEMBINA",
    items: [
      {
        to: "/mentor/assignments",
        label: "Kelola Tugas",
        icon: ClipboardList,
        requires: "supervisor",
      },
    ],
  },
];

function readStoredState(): Record<string, boolean> {
  if (typeof window === "undefined") return { UTAMA: true };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { UTAMA: true };
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : { UTAMA: true };
  } catch {
    return { UTAMA: true };
  }
}

function AppLayout() {
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: org } = useQuery({ queryKey: ["org-settings"], queryFn: fetchOrgSettings });
  const { data: logoUrl } = useQuery({
    queryKey: ["org-logo", org?.logo_url],
    queryFn: () => resolveLogoUrl(org?.logo_url),
    enabled: !!org?.logo_url,
  });
  const { data: sectionSettings } = useQuery({
    queryKey: ["section-settings"],
    queryFn: fetchSectionSettings,
    staleTime: 5 * 60 * 1000,
  });
  const { data: sectionOverrides } = useQuery({
    queryKey: ["section-overrides"],
    queryFn: fetchSectionOverrides,
    staleTime: 5 * 60 * 1000,
  });

  const canManageOrg = isBPH(profile?.role);
  const canApprove = canApproveFunds(profile?.role);
  const supervisor = isSupervisor(profile?.role);
  const categoryAdmin = canManageCategories(profile?.role);
  const sectionAdmin = canManageSections(profile?.role);
  const pendingAssignments = usePendingAssignmentCount();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ UTAMA: true });
  useEffect(() => {
    setExpanded(readStoredState());
  }, []);

  function toggleSection(key: string) {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function allowed(item: NavItem) {
    if (item.requires === "categoryAdmin") return categoryAdmin;
    if (item.requires === "orgAdmin") return canManageOrg;
    if (item.requires === "fundApprover") return canApprove;
    if (item.requires === "supervisor") return supervisor;
    if (item.requires === "sectionAdmin") return sectionAdmin;
    return true;
  }

  const visibleSections = useMemo(() => {
    return navSections
      .map((section) => ({ ...section, items: section.items.filter(allowed) }))
      .filter((section) => section.items.length > 0)
      .filter((section) =>
        isSectionVisible(section.key, {
          role: profile?.role,
          division: (profile as { division?: string | null } | null | undefined)?.division ?? null,
          settings: sectionSettings ?? null,
          overrides: sectionOverrides ?? null,
        }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.role,
    (profile as { division?: string | null } | null | undefined)?.division,
    sectionSettings,
    sectionOverrides,
    categoryAdmin,
    canManageOrg,
    canApprove,
    supervisor,
    sectionAdmin,
  ]);

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  function badgeFor(to: string) {
    return to === "/mentor-tasks" ? pendingAssignments : 0;
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={org?.org_name ?? "Logo organisasi"}
              className="h-9 max-w-[160px] object-contain"
            />
          ) : (
            <span className="text-lg font-bold tracking-tight">{org?.org_name ?? "OrgTool"}</span>
          )}
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {visibleSections.map((section) => {
            const hasActive = section.items.some(
              (item) => pathname === item.to || pathname.startsWith(item.to + "/"),
            );
            const isOpen = hasActive || !!expanded[section.key];
            const sectionBadge = section.items.reduce((sum, i) => sum + badgeFor(i.to), 0);
            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <span className="flex-1 text-left">{section.label}</span>
                  {!isOpen && sectionBadge > 0 && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                      {sectionBadge}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
                  style={{ maxHeight: isOpen ? `${section.items.length * 48 + 8}px` : "0px" }}
                >
                  <div className="space-y-1 pb-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeProps={{
                          className:
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                        }}
                      >
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {badgeFor(item.to) > 0 && (
                          <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                            {badgeFor(item.to)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name ?? "Pengguna"}</p>
              <p className="text-xs text-muted-foreground">{profile?.role ?? "Anggota"}</p>
            </div>
            <UserAvatar path={profile?.photo_url} name={profile?.full_name} className="size-9" />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <ProfileCompletionGate>
            <Outlet />
          </ProfileCompletionGate>
        </main>
      </div>
    </div>
  );
}
