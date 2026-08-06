import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

/** Authenticated shell. Every child route renders inside sidebar + topbar. */
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    const token = localStorage.getItem("finsight:token");
    if (!token) {
      throw redirect({ to: "/login", replace: true });
    }
    
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem("finsight:token");
        throw redirect({ to: "/login", replace: true });
      }
    } catch {
      localStorage.removeItem("finsight:token");
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <RoleGuard allow={["analyst", "cfo", "admin"]}>
        <Outlet />
      </RoleGuard>
    </AppShell>
  );
}
