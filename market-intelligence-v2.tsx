// frontend_new/src/components/market-intelligence.tsx

import { TrendingUp, TrendingDown, Activity, Building2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketIntelligence, useBankMarketIntelligence } from "@/lib/queries";
import type { MarketIntelligence } from "@/lib/api";

// ---------------------------------------------------------------- helpers

function parsePrice(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return parseFloat(raw.replace(/,/g, "")) || 0;
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, string>;
    return parseFloat((obj.NSE ?? obj.BSE ?? "0").replace(/,/g, "")) || 0;
  }
  return 0;
}

function parseNum(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return parseFloat(raw.replace(/,/g, "")) || 0;
  return 0;
}

function fmt(n: number, decimals = 2): string {
  if (!n || isNaN(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

function fmtCr(raw: unknown): string {
  const n = parseNum(raw);
  if (!n) return "—";
  if (n >= 100000) return `₹${fmt(n / 100000, 1)}L Cr`;
  return `₹${fmt(n, 0)} Cr`;
}

function tickerLabel(ticker: string): string {
  return ticker.replace(".NS", "").replace(".BO", "");
}

// ---------------------------------------------------------------- bank price card (dashboard)

function BankPriceCard({ intel }: { intel: MarketIntelligence }) {
  const md = intel.market_data as Record<string, unknown>;
  const cp = intel.company_profile as Record<string, unknown>;

  const nsePrice = parsePrice(md?.current_price);
  const yearHigh = parseNum(cp?.yearHigh);
  const yearLow = parseNum(cp?.yearLow);

  // day change not available — show 52W range instead
  const hasRange = yearHigh > 0 && yearLow > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">
              {(cp?.name as string) ?? tickerLabel(intel.ticker)}
            </p>
            <p className="text-xs text-muted-foreground">
              {tickerLabel(intel.ticker)} · NSE
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {intel.source === "indianapi.in" ? "Live" : "Delayed"}
          </Badge>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-2xl font-bold tabular-nums">
            {nsePrice > 0 ? `₹${fmt(nsePrice)}` : "—"}
          </span>
        </div>

        {hasRange && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>52W Low: <span className="text-foreground font-medium">₹{fmt(yearLow)}</span></span>
              <span>52W High: <span className="text-foreground font-medium">₹{fmt(yearHigh)}</span></span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(100, ((nsePrice - yearLow) / (yearHigh - yearLow)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground/70">
          As of {intel.fetch_date?.slice(0, 10)} NSE
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- skeleton

function PriceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- dashboard panel

export function MarketOverviewPanel() {
  const { data, isPending, isError, refetch, isFetching } = useMarketIntelligence();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-sm">Live Market Prices</h2>
          <Badge variant="secondary" className="text-[10px]">indianapi.in</Badge>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isError ? (
        <p className="text-sm text-muted-foreground">Market data unavailable.</p>
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <PriceCardSkeleton key={i} />)}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No market data yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {data.map((intel) => <BankPriceCard key={intel.ticker} intel={intel} />)}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- bank detail panel

export function BankMarketDetail({ ticker }: { ticker: string }) {
  const { data, isPending, isError } = useBankMarketIntelligence(ticker);

  if (isPending) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Live market data unavailable for {ticker}.</p>
        </CardContent>
      </Card>
    );
  }

  const md = data.market_data as Record<string, unknown>;
  const cp = data.company_profile as Record<string, unknown>;
  const is_stmt = data.income_statement as Record<string, unknown> | null;
  const cf = data.cash_flow as Record<string, unknown> | null;

  const nsePrice = parsePrice(md?.current_price);
  const bsePrice = parseFloat(
    ((md?.current_price as Record<string, string>)?.BSE ?? "0").replace(/,/g, "")
  ) || 0;
  const yearHigh = parseNum(cp?.yearHigh);
  const yearLow = parseNum(cp?.yearLow);

  // Income statement fields
  const sales = parseNum(is_stmt?.sales);
  const netProfit = parseNum(is_stmt?.net_profit);
  const eps = parseNum(is_stmt?.eps);
  const interest = parseNum(is_stmt?.interest);

  // Cash flow
  const cfOps = parseNum(cf?.["Cash from operating activity"]);
  const cfInv = parseNum(cf?.["Cash from investing activity"]);
  const cfFin = parseNum(cf?.["Cash from finance activity"]);

  // Risk meter from company profile
  const riskMeter = cp?.riskMeter as Record<string, unknown> | undefined;
  const stdDev = parseNum(riskMeter?.stdDev);
  const riskCategory = riskMeter?.categoryName as string | undefined;

  const priceRows = [
    { label: "NSE Price", value: nsePrice > 0 ? `₹${fmt(nsePrice)}` : null },
    { label: "BSE Price", value: bsePrice > 0 ? `₹${fmt(bsePrice)}` : null },
    { label: "52W High", value: yearHigh > 0 ? `₹${fmt(yearHigh)}` : null },
    { label: "52W Low", value: yearLow > 0 ? `₹${fmt(yearLow)}` : null },
  ].filter((r) => r.value !== null);

  const incomeRows = [
    { label: "Sales (TTM)", value: sales > 0 ? fmtCr(sales) : null },
    { label: "Net Profit (TTM)", value: netProfit > 0 ? fmtCr(netProfit) : null },
    { label: "EPS", value: eps > 0 ? `₹${fmt(eps)}` : null },
    { label: "Interest Expense", value: interest > 0 ? fmtCr(interest) : null },
  ].filter((r) => r.value !== null);

  const cashRows = [
    { label: "Operating CF", value: cfOps !== 0 ? fmtCr(Math.abs(cfOps)) + (cfOps >= 0 ? "" : " (out)") : null },
    { label: "Investing CF", value: cfInv !== 0 ? fmtCr(Math.abs(cfInv)) + (cfInv >= 0 ? " (in)" : " (out)") : null },
    { label: "Financing CF", value: cfFin !== 0 ? fmtCr(Math.abs(cfFin)) + (cfFin >= 0 ? " (in)" : " (out)") : null },
  ].filter((r) => r.value !== null);

  return (
    <div className="space-y-4">
      {/* Price Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Live Market Data
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {data.source === "indianapi.in" ? "Live · indianapi.in" : "Delayed"}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            As of {data.fetch_date?.slice(0, 10)} IST
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {priceRows.map((r) => (
              <div key={r.label}>
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="text-sm font-semibold">{r.value}</p>
              </div>
            ))}
          </div>
          {yearHigh > 0 && yearLow > 0 && nsePrice > 0 && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>52W position</span>
                <span>{fmt(((nsePrice - yearLow) / (yearHigh - yearLow)) * 100, 0)}% of range</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((nsePrice - yearLow) / (yearHigh - yearLow)) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {riskCategory && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {riskCategory}
              </Badge>
              {stdDev > 0 && (
                <span className="text-xs text-muted-foreground">σ {fmt(stdDev)}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Statement */}
      {incomeRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Income Statement (TTM)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {incomeRows.map((r) => (
                <div key={r.label}>
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className="text-sm font-semibold">{r.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Flow */}
      {cashRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-y-3">
              {cashRows.map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className="text-sm font-semibold">{r.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
