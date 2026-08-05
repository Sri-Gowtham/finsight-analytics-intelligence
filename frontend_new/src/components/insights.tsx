import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Eye, EyeOff, FileSearch, Fingerprint, Sigma } from "lucide-react";
import type { Insight } from "@/lib/types";
import { dateTime } from "@/lib/format";
import { AiBadge, ConfidenceMeter, DirectionBadge, StatusBadge } from "@/components/data-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/** Analyst-facing insight card. Links to the bank detail trail. */
export function AnalystInsightCard({ insight, bankName }: { insight: Insight; bankName?: string | undefined }) {
  return (
    <article className="surface flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <AiBadge />
        <Badge variant="outline">{insight.category}</Badge>
        <DirectionBadge direction={insight.direction} />
        <StatusBadge status={insight.status} />
        <span className="ml-auto text-xs text-muted-foreground">
          {dateTime(insight.generatedAt)}
        </span>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {bankName ?? insight.bankSymbol}
        </p>
        <h3 className="text-base font-semibold leading-snug">{insight.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{insight.analystBody}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ConfidenceMeter value={insight.confidence} />
        <Button asChild variant="outline" size="sm">
          <Link to="/banks/$symbol" params={{ symbol: insight.bankSymbol }}>
            Open insight trail
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
}

/**
 * Analyst-only verifiable trail. Exposes source_metric_ids and formulas —
 * never rendered in any CFO route.
 */
export function InsightTrail({ insight }: { insight: Insight }) {
  return (
    <section aria-label="AI insight trail" className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Fingerprint className="size-4 text-ai" aria-hidden />
          AI Insight Trail
        </h3>
        <Badge variant="outline" className="font-mono text-[10px]">
          {insight.model}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {insight.trail.length} verifiable steps
        </span>
      </header>

      <ol className="relative space-y-4 border-l border-border pl-6">
        {insight.trail.map((step) => (
          <li key={step.step} className="relative">
            <span
              className="absolute -left-[31px] flex size-5 items-center justify-center rounded-full bg-ai-soft text-[10px] font-bold text-ai"
              aria-hidden
            >
              {step.step}
            </span>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{step.action}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Metric</dt>
                  <dd className="font-medium">{step.metricLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Observed value</dt>
                  <dd className="font-semibold tabular-nums">{step.value}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">source_metric_id</dt>
                  <dd className="truncate font-mono text-[11px]" title={step.source_metric_id}>
                    {step.source_metric_id}
                  </dd>
                </div>
              </dl>
              {step.formula ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  <Sigma className="size-3.5 shrink-0" aria-hidden />
                  {step.formula}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * CFO-safe basis. Deliberately renders only narrativeBasis — no metric values,
 * formulas or source_metric_ids ever reach this component.
 */
export function CfoBasisPanel({ basis }: { basis: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-cfo/40 bg-cfo-soft/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileSearch className="size-4" aria-hidden />
            Basis for this conclusion
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Plain-language reasoning. Underlying metrics and model internals are restricted to the
            research team.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="cfo-basis-list"
        >
          {open ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {open ? "Hide basis" : "Show basis"}
        </Button>
      </div>
      {open ? (
        <>
          <Separator className="my-4" />
          <ul id="cfo-basis-list" className="space-y-2.5">
            {basis.map((point, i) => (
              <li key={point} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
