import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useAdminPortfolios, useAdminCreatePortfolio, useAdminDeletePortfolio } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ClientOnboardingForm } from "@/components/ClientOnboardingForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/admin/clients")({
  component: () => (
    <RoleGuard allow={["admin"]}>
      <ClientManagementPage />
    </RoleGuard>
  ),
});

function ClientManagementPage() {
  const portfolios = useAdminPortfolios();
  const deletePortfolio = useAdminDeletePortfolio();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          eyebrow="Administration"
          title="Client Portfolios"
          description="Manage which banks each client has in their portfolio."
        />
        <ClientOnboardingModal />
      </div>

      {portfolios.isError ? (
        <ErrorState onRetry={() => void portfolios.refetch()} />
      ) : portfolios.isPending ? (
        <LoadingState rows={3} />
      ) : (portfolios.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No client portfolios yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {(portfolios.data ?? []).map((c) => (
            <li
              key={c.id}
              className="surface flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.bankSymbols.length} bank
                  {c.bankSymbols.length !== 1 ? "s" : ""} in portfolio
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.bankSymbols.map((sym) => (
                    <Badge key={sym} variant="outline" className="text-xs">
                      {sym}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={deletePortfolio.isPending}
                onClick={() =>
                  deletePortfolio.mutate(c.id, {
                    onSuccess: () => toast.success("Portfolio entry removed"),
                    onError: () => toast.error("Failed to remove entry"),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-destructive/80" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ClientOnboardingModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Banking Client Onboarding</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ClientOnboardingForm onCancel={() => setOpen(false)} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
