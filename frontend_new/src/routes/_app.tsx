import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

/** Authenticated shell. Every child route renders inside sidebar + topbar. */
export const Route = createFileRoute("/_app")({
  ssr: false,
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
