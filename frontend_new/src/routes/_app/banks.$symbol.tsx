import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, GitCompareArrows, Rewind } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader, EmptyState } from "@/components/states";
import { useBank, useInsights } from "@/lib/queries";
import { crore, pct, signedPct } from "@/lib/format";
import { StatCard } from "@/components/data-display";
import { AiBadge, ConfidenceMeter, DirectionBadge, StatusBadge } from "@/components/data-display";
import { BankMarketDetail } from "@/components/market-intelligence";
import { InsightTrail } from "@/components/insights";
import { TrendAreaChart, TrendLineChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/banks/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — Bank Detail | FinSight` },
      {
        name: "description",
        content: `Detailed FinSight coverage of ${params.symbol}: reported quarterly metrics, trends and AI insights with a fully verifiable source trail.`,
      },
      { property: "og:title", content: `${params.symbol} — Bank Detail | FinSight` },
      {
        property: "og:description",
        content: `Quarterly metrics and transparent AI insight trails for ${params.symbol}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <BankDetailPage />
    </RoleGuard>
  ),
});

function BankDetailPage() {
  const { symbol } = Route.useParams();
  const bank = useBank(symbol);
  const insights = useInsights({ bankSymbol: symbol });

  if (bank.isError) {
    return (
      <ErrorState
        message={bank.error instanceof Error ? bank.error.message : undefined}
        onRetry={() => void bank.refetch()}
      />
    );
  }
  if (bank.isPending || !bank.data) return <LoadingState rows={5} />;

  const b = bank.data;
  const first = b.history[0]!;
  const last = b.latest;

  return (
    <>
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to coverage
      </Link>

      <PageHeader
        eyebrow={`${b.segment} sector bank · ${b.symbol}`}
        title={b.name}
        description={`Latest reported quarter ${last.quarter}. Modelled coverage across eight consecutive reported periods.`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/compare" search={{ symbols: b.symbol }}>
                <GitCompareArrows className="size-4" aria-hidden />
                Compare
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/replay" search={{ symbol: b.symbol }}>
                <Rewind className="size-4" aria-hidden />
                Replay
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/scenarios" search={{ symbol: b.symbol }}>
                <FlaskConical className="size-4" aria-hidden />
                What-if
              </Link>
            </Button>
          </>
        }
      />

      <BankMarketDetail ticker={symbol} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Last price"
          value={`₹${b.price.toFixed(2)}`}
          trend={b.changePct}
          hint="day move"
        />
        <StatCard label="Market cap" value={crore(b.marketCapCr)} hint="NSE listed" />
        <StatCard
          label="Net interest margin"
          value={pct(last.nim)}
          hint={`from ${pct(first.nim)} in ${first.quarter}`}
        />
        <StatCard
          label="Gross NPA"
          value={pct(last.gnpa)}
          hint={`${signedPct(last.gnpa - first.gnpa)} vs ${first.quarter}`}
        />
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="metrics">Reported metrics</TabsTrigger>
          <TabsTrigger value="insights">AI insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Margin and asset quality</h2>
              <p className="text-xs text-muted-foreground">Percent, by reported quarter</p>
              <div className="mt-4">
                <TrendLineChart
                  data={b.history}
                  series={[
                    { key: "nim", label: "NIM" },
                    { key: "gnpa", label: "Gross NPA" },
                    { key: "nnpa", label: "Net NPA" },
                  ]}
                />
              </div>
            </section>
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Profit after tax</h2>
              <p className="text-xs text-muted-foreground">₹ crore, by reported quarter</p>
              <div className="mt-4">
                <TrendAreaChart data={b.history} series={[{ key: "pat", label: "PAT (₹ Cr)" }]} />
              </div>
            </section>
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Balance sheet growth</h2>
              <p className="text-xs text-muted-foreground">₹ crore</p>
              <div className="mt-4">
                <TrendAreaChart
                  data={b.history}
                  series={[
                    { key: "advances", label: "Advances" },
                    { key: "deposits", label: "Deposits" },
                  ]}
                />
              </div>
            </section>
            <section className="surface p-5">
              <h2 className="text-sm font-semibold">Capital and funding mix</h2>
              <p className="text-xs text-muted-foreground">Percent</p>
              <div className="mt-4">
                <TrendLineChart
                  data={b.history}
                  series={[
                    { key: "car", label: "CAR" },
                    { key: "casa", label: "CASA" },
                  ]}
                />
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="surface overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead className="text-right">NIM</TableHead>
                  <TableHead className="text-right">GNPA</TableHead>
                  <TableHead className="text-right">NNPA</TableHead>
                  <TableHead className="text-right">CAR</TableHead>
                  <TableHead className="text-right">CASA</TableHead>
                  <TableHead className="text-right">ROA</TableHead>
                  <TableHead className="text-right">PAT (₹ Cr)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...b.history].reverse().map((point) => (
                  <TableRow key={point.quarter}>
                    <TableCell className="font-medium">{point.quarter}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.nim)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.gnpa)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.nnpa)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.car)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.casa)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(point.roa)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {point.pat.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.isPending ? (
            <LoadingState rows={2} />
          ) : (insights.data ?? []).length === 0 ? (
            <EmptyState
              title="No AI insights for this bank yet"
              description="The insight engine has not produced a conclusion for this institution in the current cycle."
            />
          ) : (
            (insights.data ?? []).map((insight) => (
              <article key={insight.id} className="surface space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <AiBadge />
                  <Badge variant="outline">{insight.category}</Badge>
                  <DirectionBadge direction={insight.direction} />
                  <StatusBadge status={insight.status} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold leading-snug">{insight.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insight.analystBody}
                  </p>
                </div>
                <ConfidenceMeter value={insight.confidence} />
                <InsightTrail insight={insight} />
                {insight.reviewNote ? (
                  <p className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {insight.reviewedBy} ({insight.status}):
                    </span>{" "}
                    {insight.reviewNote}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
