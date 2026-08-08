import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useAdminPortfolios, useAdminDeletePortfolio } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/portfolios")({
  component: () => (
    <RoleGuard allow={["admin"]}>
      <PortfoliosPage />
    </RoleGuard>
  ),
});

function PortfoliosPage() {
  const portfolios = useAdminPortfolios();
  const deletePortfolio = useAdminDeletePortfolio();

  const rows = (portfolios.data ?? []) as any[];

  // Group by client for display
  const byClient: Record<string, typeof rows> = {};
  for (const row of rows) {
    if (!byClient[row.client_name]) byClient[row.client_name] = [];
    byClient[row.client_name]!.push(row);
  }


  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Portfolio Management"
        description="Manage which banks are tracked in each client portfolio. Add or remove bank assignments."
      />

      {portfolios.isError ? (
        <ErrorState onRetry={() => void portfolios.refetch()} />
      ) : portfolios.isPending ? (
        <LoadingState rows={3} />
      ) : Object.keys(byClient).length === 0 ? (
        <p className="text-sm text-muted-foreground mt-6">
          No portfolios found.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(byClient).map(([clientName, clientRows]) => (
            <div key={clientName} className="surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">{clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {clientRows.length} bank
                    {clientRows.length !== 1 ? "s" : ""} tracked ·{" "}
                    Analyst:{" "}
                    {clientRows[0]?.analyst_name ?? "Unassigned"}
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {clientRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.ticker}
                      </Badge>
                      <span className="text-sm">{row.bank_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletePortfolio.isPending}
                      onClick={() =>
                        deletePortfolio.mutate(String(row.id), {
                          onSuccess: () =>
                            toast.success(`${row.ticker} removed from ${clientName}`),
                          onError: () =>
                            toast.error("Failed to remove bank from portfolio"),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive/70" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
