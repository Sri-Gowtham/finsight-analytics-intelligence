import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows, X } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks } from "@/lib/queries";
import { crore, pct } from "@/lib/format";
import { ComparisonBarChart, TrendLineChart, SERIES_COLORS } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function ComparePage() {
  const { symbols } = Route.useSearch() as { symbols: string };
  const navigate = Route.useNavigate();
  const { data, isPending, isError, refetch } = useBanks();

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

  const barData = chosen.map((b) => ({
    name: b.symbol,
    nim: b.latest.nim,
    gnpa: b.latest.gnpa,
    roa: b.latest.roa,
    car: b.latest.car,
  }));

  const nimTrend = (banks[0]?.history ?? []).map((point, i) => {
    const row: Record<string, string | number> = { quarter: point.quarter };
    chosen.forEach((bank) => {
      row[bank.symbol] = bank.history[i]?.nim ?? 0;
    });
    return row;
  });

  const rows: { label: string; get: (b: Bank) => string }[] = [
    { label: "Segment", get: (b) => b.segment },
    { label: "Market cap", get: (b) => crore(b.marketCapCr) },
    { label: "Net interest margin", get: (b) => pct(b.latest.nim) },
    { label: "Gross NPA", get: (b) => pct(b.latest.gnpa) },
    { label: "Net NPA", get: (b) => pct(b.latest.nnpa) },
    { label: "Capital adequacy", get: (b) => pct(b.latest.car) },
    { label: "CASA ratio", get: (b) => pct(b.latest.casa) },
    { label: "Return on assets", get: (b) => pct(b.latest.roa) },
    { label: "PAT (₹ Cr)", get: (b) => b.latest.pat.toLocaleString("en-IN") },
    { label: "Advances (₹ Cr)", get: (b) => b.latest.advances.toLocaleString("en-IN") },
    { label: "Deposits (₹ Cr)", get: (b) => b.latest.deposits.toLocaleString("en-IN") },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Benchmarking"
        title="Peer comparison"
        description={`Select up to ${MAX} institutions to compare on the latest reported quarter and margin trajectory.`}
        actions={
          selected.length ? (
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          ) : null
        }
      />

      <div className="surface space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coverage universe ({selected.length}/{MAX} selected)
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

      {chosen.length === 0 ? (
        <EmptyState
          title="No banks selected"
          description="Pick institutions from the coverage universe above to start comparing."
          icon={<GitCompareArrows className="size-5" aria-hidden />}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Latest quarter benchmark</h2>
              <p className="text-xs text-muted-foreground">Percent</p>
              <div className="mt-4">
                <ComparisonBarChart
                  data={barData}
                  series={[
                    { key: "nim", label: "NIM" },
                    { key: "gnpa", label: "GNPA" },
                    { key: "roa", label: "ROA" },
                    { key: "car", label: "CAR" },
                  ]}
                />
              </div>
            </section>
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Margin trajectory</h2>
              <p className="text-xs text-muted-foreground">Net interest margin, percent</p>
              <div className="mt-4">
                <TrendLineChart
                  data={nimTrend}
                  height={300}
                  series={chosen.map((b, i) => ({
                    key: b.symbol,
                    label: b.symbol,
                    color: SERIES_COLORS[i % SERIES_COLORS.length],
                  }))}
                />
              </div>
            </section>
          </div>

          <section className="surface overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Metric</TableHead>
                  {chosen.map((b) => (
                    <TableHead key={b.symbol} className="text-right">
                      <span className="block font-semibold text-foreground">{b.symbol}</span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {b.name}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {chosen.map((b) => (
                      <TableCell key={b.symbol} className="text-right tabular-nums">
                        {row.get(b)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <div className="flex flex-wrap gap-2">
            {chosen.map((b) => (
              <Badge key={b.symbol} variant="outline">
                {b.name} · {b.latest.quarter}
              </Badge>
            ))}
          </div>
        </>
      )}
    </>
  );
}
