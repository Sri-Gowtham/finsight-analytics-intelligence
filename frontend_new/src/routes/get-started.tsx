import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Get Started — FinSight Financial Intelligence" },
      {
        name: "description",
        content: "Choose how you want to access the FinSight Financial Intelligence platform.",
      },
      { property: "og:title", content: "Get Started — FinSight Financial Intelligence" },
      { property: "og:description", content: "Choose your access role: Admin, Analyst, or CFO workspace." },
    ],
  }),
  component: GetStartedPage,
});

function GetStartedPage() {
  return (
    <div className="gradient-hero flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to overview
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src="/finlogo.jpeg"
              alt="FinSight Financial Intelligence"
              className="size-9 rounded-xl object-cover shadow-[var(--shadow-glow)]"
            />
            <span className="leading-tight">
              <span className="block text-base font-bold">FinSight</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Financial Intelligence
              </span>
            </span>
          </div>
        </div>

        <div className="text-center space-y-3 mt-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-gradient-emerald">FinSight</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Choose how you want to access the platform.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Card 1: Admin */}
          <div className="surface flex flex-col justify-between rounded-2xl p-7 border border-border/80 bg-card/90 backdrop-blur shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="size-7" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Create and manage your organization workspace.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Button asChild size="lg" className="w-full font-semibold shadow-sm">
                <Link to="/signup/admin">
                  Create Organization
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          {/* Card 2: Analyst */}
          <div className="surface flex flex-col justify-between rounded-2xl p-7 border border-border/80 bg-card/90 backdrop-blur shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-xl bg-ai/10 text-ai p-3">
                <Sparkles className="size-7" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Analyst</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Already invited by your organization.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Button asChild variant="outline" size="lg" className="w-full font-semibold border-border hover:bg-muted/60">
                <Link to="/login">
                  Sign In
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          {/* Card 3: CFO */}
          <div className="surface flex flex-col justify-between rounded-2xl p-7 border border-border/80 bg-card/90 backdrop-blur shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-xl bg-cfo/15 text-cfo p-3">
                <Building2 className="size-7" aria-hidden />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">CFO</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Executive users sign in with organization credentials.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Button asChild variant="outline" size="lg" className="w-full font-semibold border-border hover:bg-muted/60">
                <Link to="/login">
                  Sign In
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
