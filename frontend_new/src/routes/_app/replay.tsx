import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play, Rewind } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks } from "@/lib/queries";
import { pct, signedPct } from "@/lib/format";
import { StatCard } from "@/components/data-display";
import { TrendAreaChart, TrendLineChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

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

function ReplayPage() {
  const { symbol } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, isPending, isError, refetch } = useBanks();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const bank = (data ?? []).find((b) => b.symbol === symbol) ?? data?.[0];
  const maxIndex = (bank?.history.length ?? 1) - 1;

  useEffect(() => {
    setIndex(maxIndex);
  }, [maxIndex, symbol]);

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
    }, 1100);
    return () => clearInterval(timer);
  }, [playing, maxIndex]);

  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (isPending || !bank) return <LoadingState rows={4} />;

  const point = bank.history[Math.min(index, maxIndex)]!;
  const first = bank.history[0]!;
  const visible = bank.history.slice(0, Math.min(index, maxIndex) + 1);

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

      <div className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="gap-1 border-transparent bg-secondary text-secondary-foreground">
              <Rewind className="size-3" aria-hidden />
              {point.quarter}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Period {index + 1} of {maxIndex + 1}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous quarter"
              disabled={index === 0}
              onClick={() => setIndex((v) => Math.max(0, v - 1))}
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
                  Play replay
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next quarter"
              disabled={index >= maxIndex}
              onClick={() => setIndex((v) => Math.min(maxIndex, v + 1))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <Slider
          value={[index]}
          min={0}
          max={maxIndex}
          step={1}
          onValueChange={([v]) => {
            setPlaying(false);
            setIndex(v ?? 0);
          }}
          aria-label="Replay quarter"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          {bank.history.map((p) => (
            <span key={p.quarter} className="hidden sm:block">
              {p.quarter.replace(" ", "\u00a0")}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net interest margin"
          value={pct(point.nim)}
          hint={`${signedPct(point.nim - first.nim)} vs ${first.quarter}`}
        />
        <StatCard
          label="Gross NPA"
          value={pct(point.gnpa)}
          hint={`${signedPct(point.gnpa - first.gnpa)} vs start`}
        />
        <StatCard label="Capital adequacy" value={pct(point.car)} hint="regulatory min 11.5%" />
        <StatCard
          label="Profit after tax"
          value={`₹${point.pat.toLocaleString("en-IN")} Cr`}
          hint="reported quarter"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Margin and asset quality to date</h2>
          <p className="text-xs text-muted-foreground">
            Only periods up to {point.quarter} are revealed
          </p>
          <div className="mt-4">
            <TrendLineChart
              data={visible}
              series={[
                { key: "nim", label: "NIM" },
                { key: "gnpa", label: "Gross NPA" },
              ]}
            />
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Profit trajectory to date</h2>
          <p className="text-xs text-muted-foreground">₹ crore</p>
          <div className="mt-4">
            <TrendAreaChart data={visible} series={[{ key: "pat", label: "PAT (₹ Cr)" }]} />
          </div>
        </section>
      </div>
    </>
  );
}
