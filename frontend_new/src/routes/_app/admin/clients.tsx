import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useClients } from "@/lib/queries";
import { crore, shortDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/admin/clients")({
  head: () => ({
    meta: [
      { title: "Client Portfolios — FinSight" },
      {
        name: "description",
        content:
          "Client portfolio register: assets under advisory, covered NSE-listed banks and assigned analysts for every institutional mandate.",
      },
      { property: "og:title", content: "Client Portfolios — FinSight" },
      { property: "og:description", content: "Institutional mandates, coverage and assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <ClientsPage />
    </RoleGuard>
  ),
});

function ClientsPage() {
  const clients = useClients();

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Client portfolios"
        description="Every advisory mandate with its coverage universe and assigned research team."
      />
      {clients.isError ? (
        <ErrorState onRetry={() => void clients.refetch()} />
      ) : clients.isPending ? (
        <LoadingState rows={3} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {(clients.data ?? []).map((c) => (
            <li key={c.id} className="surface space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {c.type} · onboarded {shortDate(c.onboardedAt)}
                  </p>
                </div>
                <Badge variant="outline">{crore(c.aumCr)} AUA</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.bankSymbols.map((s) => (
                  <Badge key={s} className="border-transparent bg-secondary text-secondary-foreground">
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {c.analystIds.length} analyst{c.analystIds.length === 1 ? "" : "s"} assigned
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
