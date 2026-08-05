import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBanks, useInsights } from "@/lib/queries";
import { dateTime } from "@/lib/format";
import { AiBadge, ConfidenceMeter, DirectionBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/approvals/")({
  head: () => ({
    meta: [
      { title: "Pending Approvals — FinSight" },
      {
        name: "description",
        content:
          "CFO review queue: approve or reject AI-generated banking insights with an executive summary and qualitative basis for each recommendation.",
      },
      { property: "og:title", content: "Pending Approvals — FinSight" },
      {
        property: "og:description",
        content: "Review and sign off AI-generated insights before they reach clients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["cfo"]}>
      <ApprovalsPage />
    </RoleGuard>
  ),
});

function ApprovalsPage() {
  const insights = useInsights({ status: "pending" });
  const banks = useBanks();

  const bankName = (symbol: string) =>
    banks.data?.find((b) => b.symbol === symbol)?.name ?? symbol;

  return (
    <>
      <PageHeader
        eyebrow="Oversight"
        title="Pending approvals"
        description="Each item is summarised for executive review. Approve to release it to client reporting, or reject with a note back to the analyst."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/approvals/history">Approved history</Link>
          </Button>
        }
      />

      {insights.isError ? (
        <ErrorState onRetry={() => void insights.refetch()} />
      ) : insights.isPending ? (
        <LoadingState rows={3} />
      ) : (insights.data ?? []).length === 0 ? (
        <EmptyState
          title="Queue is clear"
          description="No insights are waiting on your review right now."
          icon={<FileCheck2 className="size-5" aria-hidden />}
        />
      ) : (
        <ul className="space-y-4">
          {(insights.data ?? []).map((insight) => (
            <li key={insight.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{insight.bankSymbol}</Badge>
                    <Badge variant="outline">{insight.category}</Badge>
                    <DirectionBadge direction={insight.direction} />
                    <AiBadge />
                  </div>
                  <h2 className="text-base font-semibold">{insight.title}</h2>
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {insight.executiveSummary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bankName(insight.bankSymbol)} · prepared {dateTime(insight.generatedAt)}
                  </p>
                </div>
                <div className="w-full max-w-[220px] space-y-3">
                  <ConfidenceMeter value={insight.confidence} />
                  <Button asChild className="w-full" size="sm">
                    <Link to="/approvals/$insightId" params={{ insightId: insight.id }}>
                      Review
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
