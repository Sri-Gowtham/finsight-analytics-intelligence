// frontend_new/src/routes/_app/reports/new.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { PageHeader, ErrorState, LoadingState } from "@/components/states";
import { useAuth } from "@/lib/auth-context";
import { useInsights } from "@/lib/queries";
import { useSubmitReport } from "@/lib/queries";
import { useClients } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/reports/new")({
  component: () => (
    <RoleGuard allow={["analyst"]}>
      <NewReportPage />
    </RoleGuard>
  ),
});

function NewReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const insights = useInsights();
  const clients = useClients();
  const submitReport = useSubmitReport();

  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedInsights, setSelectedInsights] = useState<number[]>([]);

  const toggleInsight = (id: number) => {
    setSelectedInsights((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) {
      toast.error("Please select a client portfolio.");
      return;
    }
    if (!notes.trim() || notes.trim().length < 20) {
      toast.error("Please write at least 20 characters of analyst notes.");
      return;
    }
    if (selectedInsights.length === 0) {
      toast.error("Please select at least one insight to attach.");
      return;
    }

    submitReport.mutate(
      { client_name: clientName, analyst_notes: notes.trim(), insight_ids: selectedInsights },
      {
        onSuccess: () => {
          toast.success("Report submitted to CFO for review.");
          void navigate({ to: "/reports/history" });
        },
        onError: (err: Error) => toast.error(err.message || "Failed to submit report."),
      }
    );
  };

  // Unique client names from portfolios
  const clientOptions = Array.from(
    new Set((clients.data ?? []).map((c) => (c as any).client_name ?? c.name))
  ).filter(Boolean) as string[];

  return (
    <>
      <PageHeader
        eyebrow="Analyst Workspace"
        title="Submit Report for CFO Review"
        description="Write your analysis notes and attach supporting insights before submitting."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-3xl">
        {/* Client selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">1. Select Client Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.isPending ? (
              <LoadingState rows={1} />
            ) : clientOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No client portfolios found. Ask your Admin to create one.
              </p>
            ) : (
              <Select value={clientName} onValueChange={setClientName}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Analyst notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">2. Write Analyst Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Summarise your analysis findings, key observations, and recommendations for the CFO..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {notes.length} characters · minimum 20
            </p>
          </CardContent>
        </Card>

        {/* Insight selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              3. Attach Insights ({selectedInsights.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.isError ? (
              <ErrorState onRetry={() => void insights.refetch()} />
            ) : insights.isPending ? (
              <LoadingState rows={3} />
            ) : (insights.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No insights available yet. Run the agent to generate them.
              </p>
            ) : (
              <ul className="space-y-3">
                {(insights.data ?? []).map((insight) => {
                  const checked = selectedInsights.includes(insight.id as unknown as number);
                  return (
                    <li
                      key={insight.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        checked ? "border-emerald-500 bg-emerald-50/50" : "hover:bg-muted/40"
                      }`}
                      onClick={() => toggleInsight(insight.id as unknown as number)}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleInsight(insight.id as unknown as number)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {insight.bankSymbol}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {insight.title}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {shortDate(insight.generatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {insight.analystBody}
                        </p>
                      </div>
                      {checked && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={submitReport.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitReport.isPending ? "Submitting..." : "Submit to CFO"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/dashboard" })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
