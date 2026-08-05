import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useDeleteScenarioRun, useScenarioRuns } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { dateTime, pct, signedPct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/scenarios/history")({
  head: () => ({
    meta: [
      { title: "What-If History — FinSight" },
      {
        name: "description",
        content:
          "Audit trail of every saved what-if scenario: the exact assumptions applied and the modelled impact on margin, profit, capital and risk.",
      },
      { property: "og:title", content: "What-If History — FinSight" },
      {
        property: "og:description",
        content: "Every saved scenario retained with its assumptions for audit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ScenarioHistoryPage />
    </RoleGuard>
  ),
});

function ScenarioHistoryPage() {
  const { user } = useAuth();
  const runs = useScenarioRuns(user?.id ?? "");
  const remove = useDeleteScenarioRun(user?.id ?? "");

  return (
    <>
      <PageHeader
        eyebrow="Scenario lab"
        title="What-if history"
        description="Every scenario you saved, with its assumptions preserved so a conclusion can always be reproduced."
        actions={
          <Button asChild size="sm">
            <Link to="/scenarios" search={{ symbol: "HDFCBANK" }}>New scenario</Link>
          </Button>
        }
      />

      {runs.isError ? (
        <ErrorState onRetry={() => void runs.refetch()} />
      ) : runs.isPending ? (
        <LoadingState rows={3} />
      ) : (runs.data ?? []).length === 0 ? (
        <EmptyState
          title="No saved scenarios yet"
          description="Run a what-if analysis and save it to build an auditable record of your stress cases."
          icon={<FlaskConical className="size-5" aria-hidden />}
          action={
            <Button asChild size="sm">
              <Link to="/scenarios" search={{ symbol: "HDFCBANK" }}>Open scenario lab</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {(runs.data ?? []).map((run) => (
            <li key={run.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{run.name}</h2>
                    <Badge variant="outline">{run.bankSymbol}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved {dateTime(run.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/scenarios" search={{ symbol: run.bankSymbol }}>
                      Re-run
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete scenario ${run.name}`}
                    onClick={async () => {
                      try {
                        await remove.mutateAsync(run.id);
                        toast.success("Scenario deleted");
                      } catch {
                        toast.error("Could not delete this scenario");
                      }
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                {[
                  ["Repo rate", `${run.inputs.repoRateDeltaBps > 0 ? "+" : ""}${run.inputs.repoRateDeltaBps} bps`],
                  ["GNPA shift", `${run.inputs.gnpaDeltaPct > 0 ? "+" : ""}${run.inputs.gnpaDeltaPct} pp`],
                  ["Credit growth", `${run.inputs.creditGrowthPct > 0 ? "+" : ""}${run.inputs.creditGrowthPct}%`],
                  ["CASA shift", `${run.inputs.casaDeltaPct > 0 ? "+" : ""}${run.inputs.casaDeltaPct} pp`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>

              <dl className="mt-3 grid gap-3 sm:grid-cols-4">
                {[
                  ["NIM", pct(run.result.nim), signedPct(run.result.nim - run.baseline.nim)],
                  [
                    "PAT",
                    `₹${run.result.patCr.toLocaleString("en-IN")} Cr`,
                    `${run.result.patCr >= run.baseline.patCr ? "+" : ""}${(
                      run.result.patCr - run.baseline.patCr
                    ).toLocaleString("en-IN")} Cr`,
                  ],
                  ["CAR", pct(run.result.car), signedPct(run.result.car - run.baseline.car)],
                  ["Risk score", `${run.result.riskScore}/100`, run.result.verdict],
                ].map(([label, value, delta]) => (
                  <div key={label} className="rounded-lg border border-border px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-semibold tabular-nums">{value}</dd>
                    <dd className="mt-0.5 text-muted-foreground">{delta}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
