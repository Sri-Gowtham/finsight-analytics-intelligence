import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CircleUser,
  Database,
  FileCheck2,
  FlaskConical,
  GitCompareArrows,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Rewind,
  ShieldCheck,
  Users,
  Briefcase,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initials, roleLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notification-bell";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: Record<Role, NavGroup[]> = {
  analyst: [
    {
      label: "Research",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: "/explore", label: "Explore Banks", icon: Building2 },
        { to: "/compare", label: "Peer Comparison", icon: GitCompareArrows },
        { to: "/replay", label: "Historical Replay", icon: Rewind },
      ],
    },
    {
      label: "Scenario Lab",
      items: [
        { to: "/scenarios", label: "What-If Analysis", icon: FlaskConical },
        { to: "/scenarios/history", label: "What-If History", icon: History },
      ],
    },
    {
      label: "Reports",
      items: [
        { to: "/reports/new", label: "Submit Report", icon: FileCheck2 },
        { to: "/reports/history", label: "My Reports", icon: History },
      ],
    },
    { label: "Workspace", items: [{ to: "/account", label: "Account", icon: CircleUser }] },
  ],
  cfo: [
    {
      label: "Oversight",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: "/approvals", label: "Pending Approvals", icon: FileCheck2 },
        { to: "/approvals/history", label: "Approval History", icon: History },
      ],
    },
    {
      label: "Reports",
      items: [
        { to: "/reports/review", label: "Report Queue", icon: FileText },
      ],
    },
    { label: "Workspace", items: [{ to: "/account", label: "Account", icon: CircleUser }] },
  ],
  admin: [
    {
      label: "Administration",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { to: "/admin/users", label: "User Management", icon: Users },
        { to: "/admin/clients", label: "Client Management", icon: Briefcase },
        { to: "/admin/portfolios", label: "Portfolios", icon: Briefcase },
        { to: "/admin/data-sources", label: "Data Sources", icon: Database },
      ],
    },
    { label: "Workspace", items: [{ to: "/account", label: "Account", icon: CircleUser }] },
  ],
};

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-2.5 rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <img src="/finlogo.jpeg" alt="FinSight Financial Intelligence" className="size-9 rounded-xl object-cover shadow-[var(--shadow-glow)]" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-base font-bold text-sidebar-foreground">FinSight</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/60">
            Financial Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Primary">
      {NAV[role].map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to ||
                  (pathname.startsWith(item.to) && item.to !== "/dashboard");
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ role, onNavigate }: { role: Role; onNavigate?: (() => void) | undefined }) {
  const { user, signOut } = useAuth();
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-4 py-4">
        <Brand />
      </div>
      <Separator className="bg-sidebar-border" />
      <NavList role={role} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {initials(user?.name ?? "")}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              {user?.name}
            </span>
            <span className="block truncate text-[11px] text-sidebar-foreground/55">
              {roleLabel(role)}
            </span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="mt-1 w-full justify-start gap-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.role ?? "analyst";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarBody role={role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody role={role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.firm}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.title} · NSE-listed banking coverage
            </p>
          </div>

          <Badge className="hidden gap-1 border-transparent bg-secondary text-secondary-foreground sm:inline-flex">
            <ShieldCheck className="size-3" aria-hidden />
            {roleLabel(role)} workspace
          </Badge>
          <NotificationBell />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
