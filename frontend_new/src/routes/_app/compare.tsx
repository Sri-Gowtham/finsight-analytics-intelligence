import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows, X, Download, Trophy, TrendingUp, Shield, BarChart3, Award } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { StatCard } from "@/components/data-display";
import { useBanks } from "@/lib/queries";
import { pct, quarterLabel } from "@/lib/format";
import {
  ChartPanel,
  ChartSkeleton,
  ComparisonBarChart,
  GradientAreaChart,
  HorizontalBarChart,
  RadarComparisonChart,
  TrendLineChart,
  SERIES_COLORS,
} from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Bank } from "@/lib/types";

export const Route = createFileRoute("/_app/compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    symbols: typeof search['symbols'] === "string" ? (search['symbols'] as string) : "HDFCBANK,ICICIBANK,SBIN",
  }),
  head: () => ({
    meta: [
      { title: "Peer Comparison — FinSight" },
      {
        name: "description",
        content:
          "Benchmark NSE-listed Indian banks side by side on margin, asset quality, capital adequacy, returns and funding mix.",
      },
      { property: "og:title", content: "Peer Comparison — FinSight" },
      {
        property: "og:description",
        content: "Compare up to four NSE-listed banks across the metrics that drive advice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ComparePage />
    </RoleGuard>
  ),
});

const MAX = 4;
const METRICS = ["NIM", "ROE", "ROA", "Revenue Growth", "Profit Margin"] as const;

function ComparePage() {
  const { symbols } = Route.useSearch() as { symbols: string };
  const navigate = Route.useNavigate();
  const { data, isPending, isError, refetch } = useBanks();
  const [metricFilter, setMetricFilter] = useState<string>("all");

  const selected = useMemo(
    () => symbols.split(",").filter(Boolean).slice(0, MAX) as string[],
    [symbols],
  );

  const setSelected = (next: string[]) => {
    void navigate({ to: ".", search: { symbols: next.join(",") } });
  };

  const toggle = (symbol: string) => {
    if (selected.includes(symbol)) setSelected(selected.filter((s) => s !== symbol));
    else if (selected.length < MAX) setSelected([...selected, symbol]);
  };

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isPending) return <LoadingState rows={5} />;

  const banks = data ?? [];
  const chosen = selected
    .map((s) => banks.find((b) => b.symbol === s))
    .filter((b): b is Bank => Boolean(b));

  // ── Build chart data from the banks' history arrays ──

  const allQuarters = chosen.length > 0
    ? (chosen[0]?.history ?? []).map((p) => p.quarter)
    : [];

  // NIM trend data: one row per quarter, one key per bank
  const nimTrend = allQuarters.map((q, i) => {
    const row: Record<string, string | number> = { quarter: q };
    chosen.forEach((bank) => {
      row[bank.symbol] = bank.history[i]?.nim ?? 0;
    });
    return row;
  });

  // ROE grouped bar data: one row per quarter, one key per bank
  const roeTrend = allQuarters.map((q, i) => {
    const row: Record<string, string | number> = { quarter: q };
    chosen.forEach((bank) => {
      row[bank.symbol] = bank.history[i]?.roe ?? 0;
    });
    return row;
  });

  // ROA horizontal bar data: one row per bank, latest values
  const roaData = chosen.map((b) => ({
    name: b.symbol,
    ROA: b.latest.roa,
  }));

  // Revenue growth area data: one row per quarter
  const revGrowthTrend = allQuarters.map((q, i) => {
    const row: Record<string, string | number> = { quarter: q };
    chosen.forEach((bank) => {
      row[bank.symbol] = bank.history[i]?.revenueGrowth ?? 0;
    });
    return row;
  });

  // Radar data: metrics as axes, bank values as series
  const radarMetrics = ["NIM", "ROE", "ROA", "Profit Margin", "CAR"];
  const radarData = radarMetrics.map((metric) => {
    const row: Record<string, string | number> = { metric };
    chosen.forEach((b) => {
      switch (metric) {
        case "NIM": row[b.symbol] = b.latest.nim; break;
        case "ROE": row[b.symbol] = b.latest.roe; break;
        case "ROA": row[b.symbol] = b.latest.roa; break;
        case "Profit Margin": row[b.symbol] = b.latest.profitMargin; break;
        case "CAR": row[b.symbol] = b.latest.car; break;
      }
    });
    return row;
  });

  // ── Performance summary winners ──
  const highestROE = chosen.length > 0
    ? chosen.reduce((a, b) => (a.latest.roe > b.latest.roe ? a : b))
    : null;
  const highestRevGrowth = chosen.length > 0
    ? chosen.reduce((a, b) => (a.latest.revenueGrowth > b.latest.revenueGrowth ? a : b))
    : null;
  const lowestRisk = chosen.length > 0
    ? chosen.reduce((a, b) => (a.latest.gnpa < b.latest.gnpa ? a : b))
    : null;
  const highestProfitMargin = chosen.length > 0
    ? chosen.reduce((a, b) => (a.latest.profitMargin > b.latest.profitMargin ? a : b))
    : null;

  // Overall winner: bank that wins the most categories
  const winCount = new Map<string, number>();
  [highestROE, highestRevGrowth, lowestRisk, highestProfitMargin].forEach((winner) => {
    if (winner) winCount.set(winner.symbol, (winCount.get(winner.symbol) ?? 0) + 1);
  });
  const overallWinner = chosen.length > 0
    ? chosen.reduce((a, b) => ((winCount.get(a.symbol) ?? 0) >= (winCount.get(b.symbol) ?? 0) ? a : b))
    : null;

  const bankSeries = chosen.map((b, i) => ({
    key: b.symbol,
    label: b.symbol,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <>
      <PageHeader
        eyebrow="Benchmarking"
        title="Peer comparison"
        description={`Select up to ${MAX} institutions to compare across margin, returns, growth and risk profiles.`}
        actions={
          selected.length ? (
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          ) : null
        }
      />

      {/* ── Filter Bar ── */}
      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Banks ({selected.length}/{MAX})
          </p>
          <ul className="flex flex-wrap gap-2">
            {banks.map((bank) => {
              const active = selected.includes(bank.symbol);
              return (
                <li key={bank.symbol}>
                  <button
                    type="button"
                    onClick={() => toggle(bank.symbol)}
                    aria-pressed={active}
                    disabled={!active && selected.length >= MAX}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {bank.symbol}
                    {active ? <X className="size-3" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Select value={metricFilter} onValueChange={setMetricFilter}>
            <SelectTrigger className="w-[160px]" aria-label="Filter by metric">
              <SelectValue placeholder="All metrics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All metrics</SelectItem>
              {METRICS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chosen.length === 0 ? (
        <EmptyState
          title="No banks selected"
          description="Pick institutions from the coverage universe above to start comparing."
          icon={<GitCompareArrows className="size-5" aria-hidden />}
        />
      ) : (
        <>
          {/* ── 5 Chart Panels ── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* a) NIM Multi-Line */}
            {(metricFilter === "all" || metricFilter === "NIM") && (
              <ChartPanel title="Net Interest Margin" subtitle="Quarterly NIM trend, percent">
                {nimTrend.length > 0 ? (
                  <TrendLineChart
                    data={nimTrend}
                    height={300}
                    series={bankSeries}
                    formatQuarters
                  />
                ) : (
                  <ChartSkeleton height={300} />
                )}
              </ChartPanel>
            )}

            {/* b) ROE Grouped Bar */}
            {(metricFilter === "all" || metricFilter === "ROE") && (
              <ChartPanel title="ROE Comparison" subtitle="Return on Equity by quarter">
                {roeTrend.length > 0 ? (
                  <ComparisonBarChart
                    data={roeTrend}
                    series={bankSeries}
                    xKey="quarter"
                    height={300}
                    formatQuarters
                  />
                ) : (
                  <ChartSkeleton height={300} />
                )}
              </ChartPanel>
            )}

            {/* c) ROA Horizontal Bar */}
            {(metricFilter === "all" || metricFilter === "ROA") && (
              <ChartPanel title="ROA Comparison" subtitle="Return on Assets, latest quarter">
                {roaData.length > 0 ? (
                  <HorizontalBarChart
                    data={roaData}
                    series={[{ key: "ROA", label: "ROA %" }]}
                    yKey="name"
                    height={Math.max(200, chosen.length * 80)}
                  />
                ) : (
                  <ChartSkeleton height={260} />
                )}
              </ChartPanel>
            )}

            {/* d) Revenue Growth Area */}
            {(metricFilter === "all" || metricFilter === "Revenue Growth") && (
              <ChartPanel title="Revenue Growth" subtitle="Quarter-over-quarter growth %">
                {revGrowthTrend.length > 0 ? (
                  <GradientAreaChart
                    data={revGrowthTrend}
                    series={bankSeries}
                    height={300}
                    formatQuarters
                  />
                ) : (
                  <ChartSkeleton height={300} />
                )}
              </ChartPanel>
            )}
          </div>

          {/* e) Profit Margin Radar — full width */}
          {(metricFilter === "all" || metricFilter === "Profit Margin") && (
            <ChartPanel title="Multi-Metric Radar" subtitle="NIM, ROE, ROA, Profit Margin, CAR">
              {radarData.length > 0 ? (
                <RadarComparisonChart
                  data={radarData}
                  series={bankSeries}
                  metricKey="metric"
                  height={380}
                />
              ) : (
                <ChartSkeleton height={380} />
              )}
            </ChartPanel>
          )}

          {/* ── Performance Summary Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Highest ROE"
              value={highestROE ? `${pct(highestROE.latest.roe)}` : "—"}
              hint={highestROE?.symbol}
              icon={<TrendingUp className="size-4" />}
            />
            <StatCard
              label="Highest Revenue Growth"
              value={highestRevGrowth ? `${pct(highestRevGrowth.latest.revenueGrowth)}` : "—"}
              hint={highestRevGrowth?.symbol}
              icon={<BarChart3 className="size-4" />}
            />
            <StatCard
              label="Lowest Risk"
              value={lowestRisk ? `${pct(lowestRisk.latest.gnpa)} GNPA` : "—"}
              hint={lowestRisk?.symbol}
              icon={<Shield className="size-4" />}
            />
            <StatCard
              label="Highest Profit Margin"
              value={highestProfitMargin ? `${pct(highestProfitMargin.latest.profitMargin)}` : "—"}
              hint={highestProfitMargin?.symbol}
              icon={<Trophy className="size-4" />}
            />
            <StatCard
              label="Overall Winner"
              value={overallWinner?.symbol ?? "—"}
              hint={overallWinner ? `${winCount.get(overallWinner.symbol) ?? 0} categories` : undefined}
              icon={<Award className="size-4" />}
              tone="ai"
            />
          </div>

          {/* ── Quarter badges ── */}
          <div className="flex flex-wrap gap-2">
            {chosen.map((b) => (
              <Badge key={b.symbol} variant="outline">
                {b.name} · {quarterLabel(b.latest.quarter)}
              </Badge>
            ))}
          </div>
        </>
      )}
    </>
  );
}
