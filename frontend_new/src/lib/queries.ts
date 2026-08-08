import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { Insight, InsightStatus } from "./types";

export const qk = {
  banks: ["banks"] as const,
  bank: (symbol: string) => ["banks", symbol] as const,
  clients: ["clients"] as const,
  analystClients: (id: string) => ["clients", "analyst", id] as const,
  users: ["users"] as const,
  insights: (filters?: { status?: InsightStatus; bankSymbol?: string }) =>
    ["insights", filters ?? {}] as const,
  insight: (id: string) => ["insight", id] as const,
  scenarios: (userId: string) => ["scenarios", userId] as const,
  dataSources: ["data-sources"] as const,
};

export const useBanks = () => useQuery({ queryKey: qk.banks, queryFn: api.listBanks });

export const useBank = (symbol: string) =>
  useQuery({ queryKey: qk.bank(symbol), queryFn: () => api.getBank(symbol) });

export const useClients = () => useQuery({ queryKey: qk.clients, queryFn: api.listClients });

export const useAnalystClients = (analystId: string) =>
  useQuery({
    queryKey: qk.analystClients(analystId),
    queryFn: () => api.listClientsForAnalyst(analystId),
    enabled: Boolean(analystId),
  });

export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: api.listUsers });

export const useInsights = (filters?: { status?: InsightStatus; bankSymbol?: string }) =>
  useQuery({ queryKey: qk.insights(filters), queryFn: () => api.listInsights(filters) });

export const useInsight = (id: string) =>
  useQuery({ queryKey: qk.insight(id), queryFn: () => api.getInsight(id) });

export const useScenarioRuns = (userId: string) =>
  useQuery({
    queryKey: qk.scenarios(userId),
    queryFn: () => api.listScenarioRuns(userId),
    enabled: Boolean(userId),
  });

export const useDataSources = () =>
  useQuery({ queryKey: qk.dataSources, queryFn: api.listDataSources });

/* ------------------------------------------------------------- mutations */

/** Optimistic approve/reject — the detail view flips instantly. */
export function useReviewInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.reviewInsight,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: qk.insight(vars.id) });
      const previous = qc.getQueryData<Insight>(qk.insight(vars.id));
      if (previous) {
        qc.setQueryData<Insight>(qk.insight(vars.id), {
          ...previous,
          status: vars.status,
          reviewedBy: vars.reviewedBy,
          reviewNote: vars.reviewNote,
          reviewedAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.insight(vars.id), ctx.previous);
    },
    onSettled: (_d, _e, vars) => {
      qc.invalidateQueries({ queryKey: qk.insight(vars.id) });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useProvisionUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.provisionUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; active: boolean }) =>
      api.setUserActive(vars.userId, vars.active),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

export function useSaveScenarioRun(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveScenarioRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.scenarios(userId) }),
  });
}

export function useDeleteScenarioRun(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteScenarioRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.scenarios(userId) }),
  });
}

export function useUpdateDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Parameters<typeof api.updateDataSource>[1] }) =>
      api.updateDataSource(vars.id, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.dataSources }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { userId: string; name: string; title: string }) =>
      api.updateProfile(vars.userId, { name: vars.name, title: vars.title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}
export const useAdminPortfolios = () =>
  useQuery({ queryKey: ["admin-portfolios"], queryFn: api.listClients });

export function useAdminCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.saveClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-portfolios"] }),
  });
}

export function useAdminDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-portfolios"] }),
  });
}


// ============================================================
// ADD THESE TO THE BOTTOM OF frontend_new/src/lib/queries.ts
// ============================================================

export const useMarketIntelligence = () =>
  useQuery({
    queryKey: ['market-intelligence'],
    queryFn: api.listMarketIntelligence,
    staleTime: 5 * 60 * 1000, // 5 min — data refreshes daily from agent
  });

export const useBankMarketIntelligence = (ticker: string) =>
  useQuery({
    queryKey: ['market-intelligence', ticker],
    queryFn: () => api.getMarketIntelligence(ticker),
    enabled: Boolean(ticker),
    staleTime: 5 * 60 * 1000,
  });

// ADD THESE TO THE BOTTOM OF frontend_new/src/lib/queries.ts

// ---------------------------------------------------------------- reports

export interface Report {
  report_id: number;
  client_name: string;
  analyst_id: number;
  analyst_name: string;
  analyst_email: string;
  analyst_notes: string;
  insight_ids: string;
  status: "pending" | "approved" | "rejected";
  cfo_comment: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReportInsight {
  insight_id: number;
  company_id: number;
  generated_text: string;
  insight_type: string | null;
  created_at: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

async function fetchReports(status?: string): Promise<Report[]> {
  const url = status ? `/api/reports?status=${status}` : "/api/reports";
  const res = await api.http<{ success: boolean; reports: Report[] }>(url);
  return res.reports;
}

async function fetchReport(id: string): Promise<{ report: Report; insights: ReportInsight[] }> {
  return api.http(`/api/reports/${id}`);
}

async function submitReport(data: {
  client_name: string;
  analyst_notes: string;
  insight_ids: number[];
}): Promise<{ success: boolean; report: Report }> {
  return api.http("/api/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function reviewReport(data: {
  id: number;
  status: "approved" | "rejected";
  cfo_comment?: string;
}): Promise<{ success: boolean; report: Report }> {
  return api.http(`/api/reports/${data.id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status: data.status, cfo_comment: data.cfo_comment }),
  });
}

async function fetchNotifications(): Promise<{
  notifications: Notification[];
  unread_count: number;
}> {
  return api.http("/api/reports/notifications/mine");
}

async function markNotificationRead(id: number): Promise<void> {
  await api.http(`/api/reports/notifications/${id}/read`, { method: "PATCH" });
}

export const useReports = (status?: string) =>
  useQuery({
    queryKey: ["reports", status ?? "all"],
    queryFn: () => fetchReports(status),
    staleTime: 30_000,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id),
    enabled: Boolean(id),
  });

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000, // poll every 60s
  });

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
