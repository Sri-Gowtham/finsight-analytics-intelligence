import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play, Rewind, TrendingUp, TrendingDown } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks, useInsights } from "@/lib/queries";
import { pct, signedPct, quarterLabel } from "@/lib/format";
import { StatCard } from "@/components/data-display";
import { TrendAreaChart, ChartPanel, ChartSkeleton } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/replay")({
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: typeof search['symbol'] === "string" ? (search['symbol'] as string) : "HDFCBANK",
  }),
  head: () => ({
    meta: [
      { title: "Historical Replay — FinSight" },
      {
        name: "description",
        content:
          "Replay eight reported quarters of an NSE-listed bank to see how margin, asset quality and profitability evolved period by period.",
      },
      { property: "og:title", content: "Historical Replay — FinSight" },
      {
        property: "og:description",
        content: "Step quarter by quarter through a bank's reported history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ReplayPage />
    </RoleGuard>
  ),
});

const SPEED_MAP: Record<string, number> = { "0.5x": 2200, "1x": 1100, "2x": 550 };

function ReplayPage() {
  const { symbol } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isPending, isError, refetch } = useBanks();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1x");

  const bank = (data ?? []).find((b) => b.symbol === symbol) ?? data?.[0];
  const maxIndex = (bank?.history.length ?? 1) - 1;

  // Insights for "What Changed" panel
  const insightsQuery = useInsights(bank?.symbol ? { bankSymbol: bank.symbol } : {});

  useEffect(() => {
    setIndex(maxIndex);
  }, [maxIndex, symbol]);

  // Playback auto-advance
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        if (prev >= maxIndex) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, SPEED_MAP[speed] ?? 1100);
    return () => clearInterval(timer);
  }, [playing, maxIndex, speed]);

  // Keyboard shortcut: Spacebar = Play/Pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName ?? "")) {
        e.preventDefault();
        if (index >= maxIndex && !playing) setIndex(0);
        setPlaying((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, maxIndex, playing]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isPending || !bank) return <LoadingState rows={4} />;

  const safeIndex = Math.max(0, Math.min(index, maxIndex));
  const point = bank.history[safeIndex] ?? {
    quarter: "—",
    nim: 0,
    gnpa: 0,
    nnpa: 0,
    car: 0,
    casa: 0,
    roa: 0,
    pat: 0,
    advances: 0,
    deposits: 0,
    price: 0,
    roe: 0,
    revenue: 0,
    profitMargin: 0,
    revenueGrowth: 0,
  };
  const prevPoint = safeIndex > 0 ? bank.history[safeIndex - 1] : null;
  const visible = bank.history.slice(0, safeIndex + 1);

  // Build trend chart data for visible quarters
  const trendData = visible.map((p) => ({
    quarter: p.quarter,
    revenue: p.revenue,
    profit: p.pat,
    roe: p.roe,
    roa: p.roa,
    nim: p.nim,
  }));

  // Delta calculations
  const deltas = prevPoint ? [
    { label: "Revenue", current: point.revenue, prev: prevPoint.revenue },
    { label: "ROE", current: point.roe, prev: prevPoint.roe },
    { label: "ROA", current: point.roa, prev: prevPoint.roa },
    { label: "NIM", current: point.nim, prev: prevPoint.nim },
    { label: "GNPA", current: point.gnpa, prev: prevPoint.gnpa },
    { label: "CAR", current: point.car, prev: prevPoint.car },
  ] : [];

  // Get insight text for current quarter
  const currentInsight = (insightsQuery.data ?? []).find((i) =>
    i.generatedAt && i.generatedAt.startsWith(point.quarter)
  );

  return (
    <>
      <PageHeader
        eyebrow="Time machine"
        title="Historical replay"
        description="Walk forward through reported quarters to see exactly what was knowable at each point in time."
        actions={
          <Select
            value={bank.symbol}
            onValueChange={(value) => {
              setPlaying(false);
              navigate({ to: ".", search: { symbol: value } });
            }}
          >
            <SelectTrigger className="w-[220px]" aria-label="Select bank to replay">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(data ?? []).map((b) => (
                <SelectItem key={b.symbol} value={b.symbol}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex gap-4">
        {/* ── Left: Vertical Quarter Stepper ── */}
        <aside className="hidden lg:block w-[180px] shrink-0">
          <div className="surface p-4 sticky top-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline</p>
            <nav className="quarter-stepper">
              {bank.history.map((p, i) => (
                <button
                  key={p.quarter}
                  type="button"
                  className="quarter-step"
                  data-active={i === safeIndex ? "true" : undefined}
                  data-visited={i <= safeIndex ? "true" : undefined}
                  onClick={() => {
                    setPlaying(false);
                    setIndex(i);
                  }}
                >
                  {quarterLabel(p.quarter)}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Right: Main Content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Playback controls */}
          <div className="surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="gap-1 border-transparent bg-secondary text-secondary-foreground">
                  <Rewind className="size-3" aria-hidden />
                  {quarterLabel(point.quarter)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Period {safeIndex + 1} of {maxIndex + 1}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous quarter"
                  disabled={safeIndex === 0}
                  onClick={() => { setPlaying(false); setIndex((v) => Math.max(0, v - 1)); }}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (index >= maxIndex) setIndex(0);
                    setPlaying((v) => !v);
                  }}
                >
                  {playing ? (
                    <>
                      <Pause className="size-4" aria-hidden />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="size-4" aria-hidden />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next quarter"
                  disabled={safeIndex >= maxIndex}
                  onClick={() => { setPlaying(false); setIndex((v) => Math.min(maxIndex, v + 1)); }}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
                <Select value={speed} onValueChange={setSpeed}>
                  <SelectTrigger className="w-[80px] ml-2" aria-label="Playback speed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5x">0.5×</SelectItem>
                    <SelectItem value="1x">1×</SelectItem>
                    <SelectItem value="2x">2×</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">Space</kbd> to play/pause
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net interest margin"
              value={pct(point.nim)}
              hint={prevPoint ? `${signedPct(point.nim - prevPoint.nim)} vs prev` : "first period"}
              trend={prevPoint ? point.nim - prevPoint.nim : undefined}
            />
            <StatCard
              label="Return on equity"
              value={pct(point.roe)}
              hint={prevPoint ? `${signedPct(point.roe - prevPoint.roe)} vs prev` : "first period"}
              trend={prevPoint ? point.roe - prevPoint.roe : undefined}
            />
            <StatCard
              label="Gross NPA"
              value={pct(point.gnpa)}
              hint={prevPoint ? `${signedPct(point.gnpa - prevPoint.gnpa)} vs prev` : "first period"}
              trend={prevPoint ? -(point.gnpa - prevPoint.gnpa) : undefined}
            />
            <StatCard
              label="Capital adequacy"
              value={pct(point.car)}
              hint="regulatory min 11.5%"
            />
          </div>

          {/* 5 Trend Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Revenue Trend" subtitle="Derived revenue index">
              {trendData.length > 0 ? (
                <TrendAreaChart
                  data={trendData}
                  series={[{ key: "revenue", label: "Revenue" }]}
                  height={240}
                  formatQuarters
                />
              ) : (
                <ChartSkeleton height={240} />
              )}
            </ChartPanel>

            <ChartPanel title="Profit Trend" subtitle="Profit after tax (₹ Cr proxy)">
              {trendData.length > 0 ? (
                <TrendAreaChart
                  data={trendData}
                  series={[{ key: "profit", label: "PAT" }]}
                  height={240}
                  formatQuarters
                />
              ) : (
                <ChartSkeleton height={240} />
              )}
            </ChartPanel>

            <ChartPanel title="ROE Trend" subtitle="Return on equity, percent">
              {trendData.length > 0 ? (
                <TrendAreaChart
                  data={trendData}
                  series={[{ key: "roe", label: "ROE" }]}
                  height={240}
                  formatQuarters
                />
              ) : (
                <ChartSkeleton height={240} />
              )}
            </ChartPanel>

            <ChartPanel title="ROA Trend" subtitle="Return on assets, percent">
              {trendData.length > 0 ? (
                <TrendAreaChart
                  data={trendData}
                  series={[{ key: "roa", label: "ROA" }]}
                  height={240}
                  formatQuarters
                />
              ) : (
                <ChartSkeleton height={240} />
              )}
            </ChartPanel>
          </div>

          {/* NIM Trend — full width */}
          <ChartPanel title="NIM Trend" subtitle="Net interest margin to date">
            {trendData.length > 0 ? (
              <TrendAreaChart
                data={trendData}
                series={[{ key: "nim", label: "NIM" }]}
                height={260}
                formatQuarters
              />
            ) : (
              <ChartSkeleton height={260} />
            )}
          </ChartPanel>

          {/* What Changed — Delta Panel */}
          <section className="surface p-5 space-y-4">
            <h2 className="text-sm font-semibold">What changed this quarter</h2>
            {deltas.length > 0 ? (
              <>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {deltas.map((d) => {
                    const delta = d.current - d.prev;
                    const pctChange = d.prev !== 0 ? (delta / Math.abs(d.prev)) * 100 : 0;
                    const isPositive = d.label === "GNPA" ? delta < 0 : delta > 0;
                    return (
                      <div key={d.label} className="rounded-lg border border-border p-3 text-center">
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className={`mt-1 text-sm font-bold tabular-nums flex items-center justify-center gap-1 ${
                          isPositive ? "delta-positive" : "delta-negative"
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="size-3.5" aria-hidden />
                          ) : (
                            <TrendingDown className="size-3.5" aria-hidden />
                          )}
                          {delta >= 0 ? "+" : ""}{pctChange.toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {d.prev.toFixed(2)} → {d.current.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* AI-generated explanation */}
                {currentInsight ? (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs font-semibold text-primary mb-1">AI Analysis</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentInsight.analystBody}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      {prevPoint
                        ? `Quarter-over-quarter changes for ${bank.name}. NIM moved ${signedPct(point.nim - prevPoint.nim)}, while asset quality (GNPA) shifted by ${signedPct(point.gnpa - prevPoint.gnpa)}. Capital adequacy stood at ${pct(point.car)}.`
                        : "This is the earliest available quarter. No prior period comparison available."}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                First quarter in the series — no prior period to compare against.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
