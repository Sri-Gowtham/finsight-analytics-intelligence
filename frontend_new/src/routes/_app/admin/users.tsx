import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useSetUserActive, useUsers } from "@/lib/queries";
import { dateTime, roleLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — FinSight" },
      {
        name: "description",
        content:
          "Administer analyst, CFO and admin accounts across the firm: review roles, titles and activation status for platform access control.",
      },
      { property: "og:title", content: "User Management — FinSight" },
      { property: "og:description", content: "Manage firm access, roles and activation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <UsersPage />
    </RoleGuard>
  ),
});

function UsersPage() {
  const users = useUsers();
  const setActive = useSetUserActive();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Control who can reach research, oversight and administration surfaces."
      />
      {users.isError ? (
        <ErrorState onRetry={() => void users.refetch()} />
      ) : users.isPending ? (
        <LoadingState rows={4} />
      ) : (
        <ul className="space-y-3">
          {(users.data ?? []).map((u) => (
            <li key={u.id} className="surface flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · {u.title} · joined {dateTime(u.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{roleLabel(u.role)}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {u.active ? "Active" : "Disabled"}
                  </span>
                  <Switch
                    checked={u.active}
                    aria-label={`Toggle access for ${u.name}`}
                    onCheckedChange={(checked) =>
                      setActive.mutate({ userId: u.id, active: checked })
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
