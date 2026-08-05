import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side role gate. Unauthenticated users go to /login, authenticated
 * users without the required role are bounced to their own dashboard.
 */
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const permitted = user ? allow.includes(user.role) : false;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (!permitted) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, permitted, navigate]);

  if (!ready || !user) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!permitted) {
    return (
      <div className="surface flex flex-col items-center gap-3 p-12 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your role does not permit access to this workspace area. Redirecting you to your
          dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
