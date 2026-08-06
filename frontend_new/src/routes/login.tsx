import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, navigate]);

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
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
