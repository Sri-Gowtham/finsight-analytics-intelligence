// frontend_new/src/routes/_app/reports/history.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader, ErrorState, LoadingState, EmptyState } from "@/components/states";
import { useReports } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Plus, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/reports/history")({
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <ReportHistoryPage />
    </RoleGuard>
  ),
});

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "rejected") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[status] ?? ""}`}>
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ReportHistoryPage() {
  const reports = useReports();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          eyebrow="Analyst Workspace"
          title="My Submitted Reports"
          description="Track the status of reports you have submitted for CFO review."
        />
        <Button asChild>
          <Link to="/reports/new">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Link>
        </Button>
      </div>

      {reports.isError ? (
        <ErrorState onRetry={() => void reports.refetch()} />
      ) : reports.isPending ? (
        <LoadingState rows={3} />
      ) : !reports.data?.length ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="No reports submitted yet"
          description="Submit your first report to the CFO for review."
          action={
            <Button asChild>
              <Link to="/reports/new">Submit a Report</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {reports.data.map((report) => (
            <li key={report.report_id}>
              <Card className={report.status === "rejected" ? "border-red-200" : ""}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold">{report.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {shortDate(report.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {report.analyst_notes}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {report.insight_ids.split(",").length} insight
                      {report.insight_ids.split(",").length !== 1 ? "s" : ""} attached
                    </Badge>
                    {report.reviewed_at && (
                      <span>
                        Reviewed {shortDate(report.reviewed_at)}
                        {report.reviewer_name ? ` by ${report.reviewer_name}` : ""}
                      </span>
                    )}
                  </div>

                  {/* CFO comment — shown on rejection */}
                  {report.status === "rejected" && report.cfo_comment && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">
                        CFO Rejection Comment:
                      </p>
                      <p className="text-sm text-red-700">{report.cfo_comment}</p>
                    </div>
                  )}

                  {/* CFO comment — shown on approval */}
                  {report.status === "approved" && report.cfo_comment && (
                    <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">
                        CFO Comment:
                      </p>
                      <p className="text-sm text-emerald-700">{report.cfo_comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
