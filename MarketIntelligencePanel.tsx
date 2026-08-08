// frontend_new/src/components/market-intelligence.tsx
// Drop this file into frontend_new/src/components/

import { TrendingUp, TrendingDown, Activity, Building2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketIntelligence, useBankMarketIntelligence } from "@/lib/queries";
import type { MarketIntelligence } from "@/lib/api";

// ---------------------------------------------------------------- helpers

function parsePrice(raw: string | { NSE?: string; BSE?: string } | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "string") return parseFloat(raw) || 0;
  return parseFloat(raw.NSE ?? raw.BSE ?? "0") || 0;
}

function fmt(n: number, decimals = 2): string {
  if (!n || isNaN(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

function fmtCr(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 100000) return `₹${fmt(n / 100000, 1)}L Cr`;
  return `₹${fmt(n, 0)} Cr`;
}

function tickerLabel(ticker: string): string {
  return ticker.replace(".NS", "").replace(".BO", "");
}

// ---------------------------------------------------------------- single bank price card

interface BankPriceCardProps {
  intel: MarketIntelligence;
}

function BankPriceCard({ intel }: BankPriceCardProps) {
  const md = intel.market_data;
  const nsePrice = parsePrice(md?.current_price?.NSE);
  const closePrice = parseFloat(md?.stock_details?.close ?? "0");
  const highPrice = parseFloat(md?.stock_details?.high ?? "0");
  const lowPrice = parseFloat(md?.stock_details?.low ?? "0");
  const marketCap = parseFloat(md?.market_cap ?? "0");
  const netIncome = parseFloat(md?.stock_details?.NetIncome ?? "0");

  const change = closePrice > 0 ? nsePrice - closePrice : 0;
  const changePct = closePrice > 0 ? (change / closePrice) * 100 : 0;
  const isUp = changePct >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">
              {intel.company_profile?.name ?? tickerLabel(intel.ticker)}
            </p>
            <p className="text-xs text-muted-foreground">{tickerLabel(intel.ticker)}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {intel.source === "indianapi.in" ? "Live" : "Delayed"}
          </Badge>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="text-2xl font-bold tabular-nums">
            ₹{fmt(nsePrice)}
          </span>
          <span
            className={`flex items-center gap-0.5 text-sm font-medium mb-0.5 ${
              isUp ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {isUp ? "+" : ""}
            {fmt(changePct, 2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            H: <span className="text-foreground font-medium">₹{fmt(highPrice)}</span>
          </span>
          <span>
            L: <span className="text-foreground font-medium">₹{fmt(lowPrice)}</span>
          </span>
          {marketCap > 0 && (
            <span className="col-span-2">
              Mkt Cap:{" "}
              <span className="text-foreground font-medium">{fmtCr(marketCap)}</span>
            </span>
          )}
          {netIncome > 0 && (
            <span className="col-span-2">
              Net Income:{" "}
              <span className="text-foreground font-medium">{fmtCr(netIncome)}</span>
            </span>
          )}
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground/70">
          As of {md?.stock_details?.date ?? intel.fetch_date?.slice(0, 10)} NSE
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- loading skeleton

function PriceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- dashboard market panel (all banks)

export function MarketOverviewPanel() {
  const { data, isPending, isError, refetch, isFetching } = useMarketIntelligence();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <h2 className="font-semibold text-sm">Live Market Prices</h2>
          <Badge variant="secondary" className="text-[10px]">
            indianapi.in
          </Badge>
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
        <p className="text-sm text-muted-foreground">
          Market data unavailable. Run the agent to fetch latest prices.
        </p>
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <PriceCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No market data yet. Run the agent to populate prices.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {data.map((intel) => (
            <BankPriceCard key={intel.ticker} intel={intel} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- single bank market detail panel

interface BankMarketDetailProps {
  ticker: string; // e.g. "HDFCBANK"
}

export function BankMarketDetail({ ticker }: BankMarketDetailProps) {
  const { data, isPending, isError } = useBankMarketIntelligence(ticker);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Live market data unavailable for {ticker}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const md = data.market_data;
  const sd = md?.stock_details;
  const nsePrice = parsePrice(md?.current_price?.NSE);
  const bsePrice = parsePrice(md?.current_price?.BSE);
  const marketCap = parseFloat(md?.market_cap ?? "0");
  const netIncome = parseFloat(sd?.NetIncome ?? "0");
  const closePrice = parseFloat(sd?.close ?? "0");
  const change = closePrice > 0 ? nsePrice - closePrice : 0;
  const changePct = closePrice > 0 ? (change / closePrice) * 100 : 0;
  const isUp = changePct >= 0;
  const week52High = parseFloat(sd?.yhigh ?? "0");
  const week52Low = parseFloat(sd?.ylow ?? "0");

  const rows: { label: string; value: string }[] = [
    { label: "NSE Price", value: `₹${fmt(nsePrice)}` },
    { label: "BSE Price", value: `₹${fmt(bsePrice)}` },
    {
      label: "Day Change",
      value: `${isUp ? "+" : ""}${fmt(changePct, 2)}%`,
    },
    { label: "Day High", value: `₹${fmt(parseFloat(sd?.high ?? "0"))}` },
    { label: "Day Low", value: `₹${fmt(parseFloat(sd?.low ?? "0"))}` },
    { label: "Prev Close", value: `₹${fmt(closePrice)}` },
    { label: "Market Cap", value: fmtCr(marketCap) },
    { label: "Net Income (TTM)", value: fmtCr(netIncome) },
    { label: "52W High", value: `₹${fmt(week52High)}` },
    { label: "52W Low", value: `₹${fmt(week52Low)}` },
  ].filter((r) => r.value !== "—" && r.value !== "₹0.00");

  return (
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
          As of {sd?.date ?? data.fetch_date?.slice(0, 10)} at {sd?.time ?? "—"} IST
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p
                className={`text-sm font-semibold ${
                  r.label === "Day Change"
                    ? isUp
                      ? "text-emerald-600"
                      : "text-red-500"
                    : ""
                }`}
              >
                {r.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
