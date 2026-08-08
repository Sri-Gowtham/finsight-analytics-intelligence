import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useAdminPortfolios } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mail, Phone, Users } from "lucide-react";

export const Route = createFileRoute("/_app/admin/clients")({
  component: () => (
    <RoleGuard allow={["admin"]}>
      <ClientManagementPage />
    </RoleGuard>
  ),
});

interface ClientSummary {
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  aum_cr: number;
  analyst_name: string | null;
  banks: string[];
}

function ClientManagementPage() {
  const portfolios = useAdminPortfolios();

  // Group raw portfolio rows by client_name
  const clients: ClientSummary[] = Object.values(
    ((portfolios.data ?? []) as any[]).reduce((acc: Record<string, ClientSummary>, row: any) => {
      const key = row.client_name;
      const details = row.client_details ?? {};
      if (!acc[key]) {
        acc[key] = {
          name: key,
          type: details.type ?? "Advisory Firm",
          contact_name: details.contact_name ?? "—",
          contact_email: details.contact_email ?? "—",
          contact_phone: details.contact_phone ?? "—",
          aum_cr: details.aum_cr ?? 0,
          analyst_name: row.analyst_name ?? null,
          banks: [],
        };
      }
      if (row.ticker) acc[key].banks.push(row.ticker);
      return acc;
    }, {})
  );

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Client Management"
        description="Manage client firms, their contact information, and analyst assignments."
      />

      {portfolios.isError ? (
        <ErrorState onRetry={() => void portfolios.refetch()} />
      ) : portfolios.isPending ? (
        <LoadingState rows={4} />
      ) : clients.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-6">
          No clients found. Add portfolios to see clients here.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {clients.map((client) => (
            <Card key={client.name}>
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">{client.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {client.type}
                    </Badge>
                  </div>
                  {client.aum_cr > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">AUM</p>
                      <p className="font-semibold text-sm">
                        ₹{(client.aum_cr / 1000).toFixed(0)}K Cr
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{client.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.contact_email}</span>
                  </div>
                  {client.contact_phone !== "—" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Banks covered */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Banks in portfolio ({client.banks.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {client.banks.map((ticker) => (
                      <Badge key={ticker} variant="secondary" className="text-xs">
                        {ticker}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Assigned analyst */}
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Assigned Analyst:{" "}
                    <span className="font-medium text-foreground">
                      {client.analyst_name ?? "Unassigned"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
