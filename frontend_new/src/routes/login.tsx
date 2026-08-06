import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, HOME_FOR_ROLE } from "@/lib/auth-context";
import { DEMO_PASSWORD } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { error?: string } => {
    const error = typeof search["error"] === "string" ? search["error"] : undefined;
    return error ? { error } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — FinSight Workspace" },
      {
        name: "description",
        content:
          "Sign in to the FinSight financial intelligence workspace. Accounts are provisioned by your firm administrator.",
      },
      { property: "og:title", content: "Sign in — FinSight Workspace" },
      {
        property: "og:description",
        content: "Provisioned access to FinSight analyst, CFO and admin workspaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid work email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { role: "Analyst", email: "analyst@finsight.demo", name: "Analyst User" },
  { role: "CFO", email: "cfo@finsight.demo", name: "CFO User" },
  { role: "Admin", email: "admin@finsight.demo", name: "Admin User" },
];

function LoginPage() {
  const { signIn, user, ready } = useAuth();
  const navigate = useNavigate();
  const { error: oauthError } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (oauthError === "oauth_failed") {
      toast.error("Google sign-in failed. Please try again.");
    }
  }, [oauthError]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const signed = await signIn(values.email, values.password);
      toast.success(`Welcome back, ${signed.name.split(" ")[0]}`);
      navigate({ to: HOME_FOR_ROLE[signed.role] ?? "/dashboard", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    }
  };

  const useDemo = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to overview
        </Link>

        <div className="surface p-7 sm:p-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="FinSight Financial Intelligence" className="size-10 rounded-xl object-cover shadow-[var(--shadow-glow)]" />
            <span className="leading-tight">
              <span className="block font-bold">FinSight</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Financial Intelligence
              </span>
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">Sign in to your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts are provisioned by your firm administrator. There is no public signup.
          </p>

          {error ? (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder="you@firm.in"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-xs font-medium text-primary transition-colors hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Verifying credentials
                  </>
                ) : (
                  <>
                    <Lock className="size-4" aria-hidden />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-white dark:text-gray-800 dark:hover:bg-gray-100"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden />
              Provisioned demo accounts
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{account.role}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {account.email}
                    </span>
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => useDemo(account.email)}>
                    Use
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Shared demo password: <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
