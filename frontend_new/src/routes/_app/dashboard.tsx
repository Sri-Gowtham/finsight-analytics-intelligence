import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Building2,
  Database,
  FileCheck2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useAnalystClients,
  useBanks,
  useClients,
  useDataSources,
  useInsights,
  useUsers,
} from "@/lib/queries";
import { crore, pct, roleLabel, shortDate, signedPct } from "@/lib/format";
import { StatCard, StatusBadge } from "@/components/data-display";
import { AnalystInsightCard } from "@/components/insights";
import { MarketOverviewPanel } from "@/components/market-intelligence";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { ComparisonBarChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Bank } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FinSight Workspace" },
      {
        name: "description",
        content:
          "Role-aware FinSight dashboard: client portfolios, AI insights awaiting review and platform health at a glance.",
      },
      { property: "og:title", content: "Dashboard — FinSight Workspace" },
      {
        property: "og:description",
        content: "Your daily view of portfolios, insights and approvals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <MarketOverviewPanel />
      <PageHeader
        eyebrow={`${roleLabel(user.role)} workspace`}
        title={`Good day, ${user.name.split(" ")[0]}`}
        description={
          user.role === "analyst"
            ? "Your client portfolios, coverage universe and AI insights awaiting verification."
            : user.role === "cfo"
              ? "Executive oversight of AI-generated recommendations awaiting your approval."
              : "Platform administration overview. No financial insights are surfaced in this role."
        }
      />
      {user.role === "analyst" ? <AnalystDashboard analystId={user.id} /> : null}
      {user.role === "cfo" ? <CfoDashboard /> : null}
      {user.role === "admin" ? <AdminDashboard /> : null}
    </>
  );
}

/* --------------------------------------------------------------- analyst */

function AnalystDashboard({ analystId }: { analystId: string }) {
  const clients = useAnalystClients(analystId);
  const banks = useBanks();
  const insights = useInsights();

  if (clients.isError || banks.isError) {
    return <ErrorState onRetry={() => void clients.refetch()} />;
  }
  if (clients.isPending || banks.isPending) return <LoadingState rows={4} />;

  const bySymbol = new Map<string, Bank>((banks.data ?? []).map((b) => [b.symbol, b]));
  const portfolios = clients.data ?? [];
  const aum = portfolios.reduce((sum, c) => sum + c.aumCr, 0);
  const covered = new Set(portfolios.flatMap((c) => c.bankSymbols ?? [(c as any).ticker]));
  const pending = (insights.data ?? []).filter((i) => i.status === "pending");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Client portfolios"
          value={String(portfolios.length)}
          hint="assigned to you"
          icon={<Briefcase className="size-4" aria-hidden />}
        />
        <StatCard
          label="Assets under advisory"
          value={crore(aum)}
          hint="across mandates"
          icon={<Wallet className="size-4" aria-hidden />}
        />
        <StatCard
          label="Banks in portfolios"
          value={String(covered.size)}
          hint={`of ${banks.data?.length ?? 0} covered`}
          icon={<Building2 className="size-4" aria-hidden />}
        />
        <StatCard
          label="Insights to verify"
          value={String(pending.length)}
          hint="pending CFO approval"
          tone="ai"
          icon={<Sparkles className="size-4" aria-hidden />}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Client portfolios</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/explore">Explore all banks</Link>
          </Button>
        </div>
        {portfolios.length === 0 ? (
          <EmptyState
            title="No portfolios assigned"
            description="Your administrator has not assigned any client mandates to you yet."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {portfolios.map((client) => {
              const holdings = (client.bankSymbols ?? [(client as any).ticker])
                .map((s) => bySymbol.get(s))
                .filter((b): b is Bank => Boolean(b));
              const avgChange =
                holdings.reduce((sum, b) => sum + b.changePct, 0) / (holdings.length || 1);
              return (
                <article key={client.id} className="surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{client.name ?? (client as any).client_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {client.type} · onboarded {shortDate(client.onboardedAt)}
                      </p>
                    </div>
                    <Badge variant="outline">{crore(client.aumCr)}</Badge>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <TrendingUp className="size-3.5" aria-hidden />
                    Portfolio day move{" "}
                    <span
                      className={avgChange >= 0 ? "text-primary" : "text-destructive"}
                    >
                      {signedPct(avgChange)}
                    </span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {holdings.map((bank) => (
                      <li key={bank.symbol}>
                        <Link
                          to="/banks/$symbol"
                          params={{ symbol: bank.symbol }}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{bank.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              GNPA {pct(bank.latest.gnpa)} · NIM {pct(bank.latest.nim)}
                            </span>
                          </span>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              bank.changePct >= 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {signedPct(bank.changePct)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Latest AI insights</h2>
        {insights.isPending ? (
          <LoadingState rows={2} />
        ) : (insights.data ?? []).length === 0 ? (
          <EmptyState title="No insights generated yet" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {(insights.data ?? []).slice(0, 4).map((insight) => (
              <AnalystInsightCard
                key={insight.id}
                insight={insight}
                bankName={bySymbol.get(insight.bankSymbol)?.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------- cfo */

function CfoDashboard() {
  const insights = useInsights();
  const banks = useBanks();

  if (insights.isError) return <ErrorState onRetry={() => void insights.refetch()} />;
  if (insights.isPending) return <LoadingState rows={4} />;

  const all = insights.data ?? [];
  const pending = all.filter((i) => i.status === "pending");
  const approved = all.filter((i) => i.status === "approved");
  const rejected = all.filter((i) => i.status === "rejected");
  const names = new Map((banks.data ?? []).map((b) => [b.symbol, b.name]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting approval"
          value={String(pending.length)}
          hint="requires your decision"
          tone="cfo"
          icon={<FileCheck2 className="size-4" aria-hidden />}
        />
        <StatCard
          label="Approved"
          value={String(approved.length)}
          hint="cleared for clients"
          icon={<UserCheck className="size-4" aria-hidden />}
        />
        <StatCard
          label="Rejected"
          value={String(rejected.length)}
          hint="returned to research"
          icon={<FileCheck2 className="size-4" aria-hidden />}
        />
        <StatCard
          label="Institutions referenced"
          value={String(new Set(all.map((i) => i.bankSymbol)).size)}
          hint="in current review queue"
          icon={<Building2 className="size-4" aria-hidden />}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Pending approvals</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/approvals">Open review queue</Link>
          </Button>
        </div>
        {pending.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="No summaries are waiting on your decision right now."
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {pending.map((insight) => (
              <li key={insight.id} className="surface p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-transparent bg-cfo-soft text-cfo-foreground hover:bg-cfo-soft">
                    {insight.category}
                  </Badge>
                  <StatusBadge status={insight.status} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {shortDate(insight.generatedAt)}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {names.get(insight.bankSymbol) ?? insight.bankSymbol}
                </p>
                <h3 className="mt-1 font-semibold leading-snug">{insight.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {insight.executiveSummary}
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/approvals/$insightId" params={{ insightId: insight.id }}>
                    Review summary
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- admin */

function AdminDashboard() {
  const users = useUsers();
  const clients = useClients();
  const sources = useDataSources();

  if (users.isError || clients.isError) return <ErrorState onRetry={() => void users.refetch()} />;
  if (users.isPending || clients.isPending || sources.isPending) return <LoadingState rows={4} />;

  const list = users.data ?? [];
  const portfolios = clients.data ?? [];
  const ds = sources.data ?? [];
  const roleCounts = [
    {
      name: "Analyst",
      users: list.filter((u) => u.role === "analyst").length,
    },
    { name: "CFO", users: list.filter((u) => u.role === "cfo").length },
    { name: "Admin", users: list.filter((u) => u.role === "admin").length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Provisioned users"
          value={String(list.length)}
          hint={`${list.filter((u) => u.active).length} active`}
          icon={<Users className="size-4" aria-hidden />}
        />
        <StatCard
          label="Client portfolios"
          value={String(portfolios.length)}
          hint={crore(portfolios.reduce((s, c) => s + c.aumCr, 0))}
          icon={<Briefcase className="size-4" aria-hidden />}
        />
        <StatCard
          label="Data sources"
          value={String(ds.length)}
          hint={`${ds.filter((d) => d.status === "connected").length} connected`}
          tone="ai"
          icon={<Database className="size-4" aria-hidden />}
        />
        <StatCard
          label="Unassigned analysts"
          value={String(
            list.filter((u) => u.role === "analyst" && u.clientIds.length === 0).length,
          )}
          hint="no client mandate"
          icon={<UserCheck className="size-4" aria-hidden />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Role distribution</h2>
          <div className="mt-4">
            <ComparisonBarChart
              data={roleCounts}
              series={[{ key: "users", label: "Users" }]}
              height={230}
            />
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Data source health</h2>
          <ul className="mt-4 space-y-3">
            {ds.map((source) => (
              <li key={source.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{source.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {source.kind} · last sync {shortDate(source.lastSyncAt)}
                  </span>
                </span>
                <Badge
                  className={
                    source.status === "connected"
                      ? "border-transparent bg-success-soft text-primary"
                      : source.status === "degraded"
                        ? "border-transparent bg-warning-soft text-warning"
                        : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {source.status}
                </Badge>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/admin/data-sources">Manage data sources</Link>
          </Button>
        </section>
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold">Administration shortcuts</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/admin/users">User management</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/clients">Client portfolios</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/account">Account settings</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Administrators cannot view AI-generated insights, analyst research or client-facing
          recommendations. This separation is enforced by role guards on every research route.
        </p>
      </div>
    </div>
  );
}
