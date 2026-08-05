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
