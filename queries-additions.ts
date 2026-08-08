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
