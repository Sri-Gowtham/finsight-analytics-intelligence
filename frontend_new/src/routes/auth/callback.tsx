import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TOKEN_KEY } from "@/lib/api";
import { useAuth, HOME_FOR_ROLE } from "@/lib/auth-context";
import { type Role } from "@/lib/types";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const { refresh, user } = useAuth();

  useEffect(() => {
    if (!token) {
      toast.error("Google sign-in token missing.");
      navigate({ to: "/login", replace: true });
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    refresh();
  }, [token, refresh, navigate]);

  useEffect(() => {
    if (user && user.role) {
      toast.success("Successfully signed in with Google!");
      const target = HOME_FOR_ROLE[user.role as Role] ?? "/dashboard";
      navigate({ to: target, replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center p-4">
      <div className="surface flex items-center gap-3 p-6 font-medium text-foreground">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        Completing Google sign-in...
      </div>
    </div>
  );
}
