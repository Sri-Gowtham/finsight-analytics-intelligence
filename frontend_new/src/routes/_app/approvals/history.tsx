import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useInsights } from "@/lib/queries";
import { dateTime } from "@/lib/format";
import { StatusBadge } from "@/components/data-display";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/approvals/history")({
  head: () => ({
    meta: [
      { title: "Approval History — FinSight" },
      {
        name: "description",
        content:
          "Complete record of reviewed AI insights with the approving executive, decision note and timestamp for governance and audit.",
      },
      { property: "og:title", content: "Approval History — FinSight" },
      {
        property: "og:description",
        content: "Every approval and rejection retained for governance and audit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["cfo"]}>
      <HistoryPage />
    </RoleGuard>
  ),
});

function HistoryPage() {
  const approved = useInsights({ status: "approved" });
  const rejected = useInsights({ status: "rejected" });

  const isError = approved.isError || rejected.isError;
  const isPending = approved.isPending || rejected.isPending;
  const items = [...(approved.data ?? []), ...(rejected.data ?? [])].sort((a, b) =>
    (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""),
  );

  return (
    <>
      <PageHeader
        eyebrow="Oversight"
        title="Approval history"
        description="An immutable record of every decision, kept for client assurance and internal governance."
      />

      {isError ? (
        <ErrorState
          onRetry={() => {
            void approved.refetch();
            void rejected.refetch();
          }}
        />
      ) : isPending ? (
        <LoadingState rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No decisions recorded yet"
          description="Reviewed insights will appear here with their decision notes."
          icon={<History className="size-5" aria-hidden />}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((insight) => (
            <li key={insight.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{insight.bankSymbol}</Badge>
                    <StatusBadge status={insight.status} />
                  </div>
                  <h2 className="font-semibold">{insight.title}</h2>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {insight.executiveSummary}
                  </p>
                  {insight.reviewNote ? (
                    <p className="max-w-3xl rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Decision note: {insight.reviewNote}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {insight.reviewedAt ? dateTime(insight.reviewedAt) : "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
