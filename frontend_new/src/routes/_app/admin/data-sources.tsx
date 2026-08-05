import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useDataSources, useUpdateDataSource } from "@/lib/queries";
import { dateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/admin/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — FinSight" },
      {
        name: "description",
        content:
          "Monitor market data, filings, regulatory and AI model connections: status, refresh schedule and last successful sync.",
      },
      { property: "og:title", content: "Data Sources — FinSight" },
      { property: "og:description", content: "Connection health for every ingestion pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <DataSourcesPage />
    </RoleGuard>
  ),
});

const TONE: Record<string, string> = {
  connected: "border-transparent bg-success-soft text-primary",
  degraded: "border-transparent bg-warning-soft text-warning",
  disabled: "border-transparent bg-muted text-muted-foreground",
};

function DataSourcesPage() {
  const sources = useDataSources();
  const update = useUpdateDataSource();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Data sources"
        description="Ingestion pipelines feeding the coverage universe and the insight engine."
      />
      {sources.isError ? (
        <ErrorState onRetry={() => void sources.refetch()} />
      ) : sources.isPending ? (
        <LoadingState rows={4} />
      ) : (
        <ul className="space-y-3">
          {(sources.data ?? []).map((s) => (
            <li key={s.id} className="surface flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{s.name}</p>
                  <Badge variant="outline">{s.kind}</Badge>
                  <Badge className={TONE[s.status]}>{s.status}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{s.endpoint}</p>
                <p className="text-xs text-muted-foreground">
                  {s.refreshCron} · last sync {dateTime(s.lastSyncAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    id: s.id,
                    patch: { status: s.status === "disabled" ? "connected" : "disabled" },
                  })
                }
              >
                {s.status === "disabled" ? "Enable" : "Disable"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
