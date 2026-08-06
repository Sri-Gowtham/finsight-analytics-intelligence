import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Search } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks } from "@/lib/queries";
import { crore, pct, signedPct } from "@/lib/format";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_app/explore")({
  head: () => ({
    meta: [
      { title: "Explore NSE Banks — FinSight" },
      {
        name: "description",
        content:
          "Browse FinSight's full coverage of NSE-listed Indian banks with margin, asset quality, capital and return metrics side by side.",
      },
      { property: "og:title", content: "Explore NSE Banks — FinSight" },
      {
        property: "og:description",
        content: "Full coverage universe of NSE-listed Indian banks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ExplorePage />
    </RoleGuard>
  ),
});

type SortKey = "marketCapCr" | "nim" | "gnpa" | "roa" | "car";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "marketCapCr", label: "Market cap" },
  { key: "nim", label: "Net interest margin" },
  { key: "gnpa", label: "Gross NPA (low to high)" },
  { key: "roa", label: "Return on assets" },
  { key: "car", label: "Capital adequacy" },
];

function ExplorePage() {
  const { data, isPending, isError, refetch } = useBanks();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | Bank["segment"]>("all");
  const [sort, setSort] = useState<SortKey>("marketCapCr");

  const banks = useMemo(() => {
    const list = (data ?? [])
      .filter((b) => (segment === "all" ? true : b.segment === segment))
      .filter((b) =>
        query.trim()
          ? `${b.name} ${b.symbol}`.toLowerCase().includes(query.trim().toLowerCase())
          : true,
      );
    return [...list].sort((a, b) =>
      sort === "marketCapCr"
        ? b.marketCapCr - a.marketCapCr
        : sort === "gnpa"
          ? a.latest.gnpa - b.latest.gnpa
          : b.latest[sort] - a.latest[sort],
    );
  }, [data, query, segment, sort]);

  return (
    <>
      <PageHeader
        eyebrow="Coverage universe"
        title="Explore NSE-listed banks"
        description="Every institution under coverage, with the latest reported quarter across margin, asset quality, capital and returns."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/compare" search={{ symbols: "HDFCBANK,ICICIBANK,SBIN" }}>Compare peers</Link>
          </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by bank name or NSE symbol"
            className="pl-9"
            aria-label="Search banks"
          />
        </div>
        <Select value={segment} onValueChange={(v) => setSegment(v as typeof segment)}>
          <SelectTrigger className="sm:w-[180px]" aria-label="Filter by segment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All segments</SelectItem>
            <SelectItem value="Private">Private</SelectItem>
            <SelectItem value="Public">Public</SelectItem>
            <SelectItem value="Small Finance">Small Finance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="sm:w-[220px]" aria-label="Sort banks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                Sort: {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isPending ? (
        <LoadingState rows={5} />
      ) : banks.length === 0 ? (
        <EmptyState
          title="No banks match your filters"
          description="Try a different search term or widen the segment filter."
          icon={<Building2 className="size-5" aria-hidden />}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setSegment("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banks.map((bank) => (
            <li key={bank.symbol}>
              <Link
                to="/banks/$symbol"
                params={{ symbol: bank.symbol }}
                className="surface block h-full p-5 transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{bank.name}</h2>
                    <p className="font-mono text-xs text-muted-foreground">{bank.symbol}</p>
                  </div>
                  <Badge variant="outline">{bank.segment}</Badge>
                </div>
                {bank.price > 0 && (
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <p className="text-xl font-bold tabular-nums">₹{bank.price.toFixed(2)}</p>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        bank.changePct >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {signedPct(bank.changePct)}
                    </p>
                  </div>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  {[
                    ["NIM", pct(bank.latest.nim)],
                    ["Gross NPA", pct(bank.latest.gnpa)],
                    ["CAR", pct(bank.latest.car)],
                    ["ROA", pct(bank.latest.roa)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
