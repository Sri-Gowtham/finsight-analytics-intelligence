// frontend_new/src/routes/_app/reports/review.tsx
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader, ErrorState, LoadingState, EmptyState } from "@/components/states";
import { useReports, useReviewReport } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import type { Report } from "@/lib/queries";

export const Route = createFileRoute("/_app/reports/review")({
  component: () => (
    <RoleGuard allow={["cfo", "admin"]}>
      <CFOReviewPage />
    </RoleGuard>
  ),
});

function CFOReviewPage() {
  const pending = useReports("pending");
  const reviewed = useReports();
  const reviewReport = useReviewReport();

  const [selected, setSelected] = useState<Report | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [comment, setComment] = useState("");

  const openDialog = (report: Report, act: "approved" | "rejected") => {
    setSelected(report);
    setAction(act);
    setComment("");
  };

  const handleReview = () => {
    if (!selected || !action) return;
    if (action === "rejected" && !comment.trim()) {
      toast.error("Please provide a rejection reason for the analyst.");
      return;
    }
    reviewReport.mutate(
      { id: selected.report_id, status: action, cfo_comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            action === "approved"
              ? `Report approved. Analyst has been notified.`
              : `Report rejected. Analyst has been notified with your comment.`
          );
          setSelected(null);
          setAction(null);
          setComment("");
        },
        onError: (err: Error) => toast.error(err.message || "Review failed."),
      }
    );
  };

  const allReviewed = (reviewed.data ?? []).filter(
    (r) => r.status !== "pending"
  );

  return (
    <>
      <PageHeader
        eyebrow="CFO Workspace"
        title="Report Review Queue"
        description="Review analyst reports and approve or reject with comments."
      />

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {(pending.data?.length ?? 0) > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0">
                {pending.data?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        {/* Pending tab */}
        <TabsContent value="pending" className="mt-4">
          {pending.isError ? (
            <ErrorState onRetry={() => void pending.refetch()} />
          ) : pending.isPending ? (
            <LoadingState rows={3} />
          ) : !pending.data?.length ? (
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title="No pending reports"
              description="All reports have been reviewed."
            />
          ) : (
            <ul className="space-y-4">
              {pending.data.map((report) => (
                <ReportCard
                  key={report.report_id}
                  report={report}
                  onApprove={() => openDialog(report, "approved")}
                  onReject={() => openDialog(report, "rejected")}
                  showActions
                />
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Reviewed tab */}
        <TabsContent value="reviewed" className="mt-4">
          {reviewed.isError ? (
            <ErrorState onRetry={() => void reviewed.refetch()} />
          ) : reviewed.isPending ? (
            <LoadingState rows={3} />
          ) : !allReviewed.length ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No reviewed reports yet"
              description="Approved and rejected reports will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {allReviewed.map((report) => (
                <ReportCard key={report.report_id} report={report} showActions={false} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve / Reject dialog */}
      <Dialog open={Boolean(selected)} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {action === "approved" ? "Approve Report" : "Reject Report"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium">{selected?.client_name}</p>
              <p className="text-xs text-muted-foreground">
                By {selected?.analyst_name} · {shortDate(selected?.created_at ?? "")}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 max-h-32 overflow-y-auto">
              <p className="text-sm">{selected?.analyst_notes}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfo-comment">
                {action === "rejected"
                  ? "Rejection Reason * (sent to analyst)"
                  : "Comment (optional — sent to analyst)"}
              </Label>
              <Textarea
                id="cfo-comment"
                placeholder={
                  action === "rejected"
                    ? "Explain why this report needs revision..."
                    : "Add an optional note for the analyst..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewReport.isPending}
              variant={action === "rejected" ? "destructive" : "default"}
            >
              {reviewReport.isPending
                ? "Saving..."
                : action === "approved"
                ? "Approve & Notify Analyst"
                : "Reject & Notify Analyst"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportCard({
  report,
  onApprove,
  onReject,
  showActions,
}: {
  report: Report;
  onApprove?: () => void;
  onReject?: () => void;
  showActions: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: "text-amber-600",
    approved: "text-emerald-600",
    rejected: "text-red-500",
  };
  const StatusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    approved: <CheckCircle2 className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold">{report.client_name}</p>
            <p className="text-xs text-muted-foreground">
              Analyst: <span className="font-medium">{report.analyst_name}</span>
              {" · "}
              {report.analyst_email}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {shortDate(report.created_at)}
            </p>
          </div>
          <span className={`flex items-center gap-1 text-sm font-medium ${statusColors[report.status]}`}>
            {StatusIcons[report.status]}
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {report.analyst_notes}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {report.insight_ids.split(",").length} insight
            {report.insight_ids.split(",").length !== 1 ? "s" : ""}
          </Badge>
          {report.reviewed_at && (
            <span className="text-xs text-muted-foreground">
              Reviewed {shortDate(report.reviewed_at)}
            </span>
          )}
        </div>

        {report.cfo_comment && (
          <div className={`rounded-lg p-3 mb-3 text-sm ${
            report.status === "rejected"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}>
            <span className="font-semibold">Your comment: </span>
            {report.cfo_comment}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={onApprove} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={onReject} className="gap-1">
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
