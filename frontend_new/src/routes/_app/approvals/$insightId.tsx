import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useBank, useInsight, useReviewInsight } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { dateTime } from "@/lib/format";
import { AiBadge, ConfidenceMeter, DirectionBadge, StatusBadge } from "@/components/data-display";
import { CfoBasisPanel } from "@/components/insights";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/approvals/$insightId")({
  head: () => ({
    meta: [
      { title: "Insight Review — FinSight" },
      {
        name: "description",
        content:
          "Executive review of a single AI-generated banking insight, with a plain-language summary and the qualitative basis behind the recommendation.",
      },
      { property: "og:title", content: "Insight Review — FinSight" },
      {
        property: "og:description",
        content: "Approve or reject an AI-generated insight with a recorded decision note.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["cfo"]}>
      <ReviewPage />
    </RoleGuard>
  ),
});

function ReviewPage() {
  const { insightId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const insight = useInsight(insightId);
  const bank = useBank(insight.data?.bankSymbol ?? "");
  const review = useReviewInsight();
  const [note, setNote] = useState("");

  if (insight.isError) return <ErrorState onRetry={() => void insight.refetch()} />;
  if (insight.isPending || !insight.data) return <LoadingState rows={4} />;

  const data = insight.data;

  const decide = async (status: "approved" | "rejected") => {
    if (!user) return;
    if (status === "rejected" && note.trim().length < 5) {
      toast.error("Please add a short note explaining the rejection");
      return;
    }
    try {
      await review.mutateAsync({
        id: data.id,
        status,
        reviewedBy: user.id,
        reviewNote: note.trim(),
      });
      toast.success(status === "approved" ? "Insight approved" : "Insight rejected");
      void navigate({ to: "/approvals" });
    } catch {
      toast.error("Could not record your decision. Please retry.");
    }
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link to="/approvals">
          <ArrowLeft className="size-4" aria-hidden />
          Back to queue
        </Link>
      </Button>

      <PageHeader
        eyebrow={bank.data?.name ?? data.bankSymbol}
        title={data.title}
        description={data.executiveSummary}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="surface space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.category}</Badge>
              <DirectionBadge direction={data.direction} />
              <StatusBadge status={data.status} />
              <AiBadge />
            </div>
            <p className="text-xs text-muted-foreground">
              Prepared {dateTime(data.generatedAt)}
            </p>
            <ConfidenceMeter value={data.confidence} />
          </section>

          <CfoBasisPanel basis={data.narrativeBasis} />
        </div>

        <aside className="surface space-y-3 self-start p-5">
          <h2 className="text-sm font-semibold">Your decision</h2>
          {data.status === "pending" ? (
            <>
              <Label htmlFor="review-note">Decision note</Label>
              <Textarea
                id="review-note"
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Context for the analyst and the audit record…"
              />
              <div className="flex flex-col gap-2">
                <Button onClick={() => void decide("approved")} disabled={review.isPending}>
                  <Check className="size-4" aria-hidden />
                  Approve insight
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void decide("rejected")}
                  disabled={review.isPending}
                >
                  <X className="size-4" aria-hidden />
                  Reject with note
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <StatusBadge status={data.status} />
              <p className="text-muted-foreground">
                Reviewed {data.reviewedAt ? dateTime(data.reviewedAt) : "—"}
              </p>
              {data.reviewNote ? (
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {data.reviewNote}
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
