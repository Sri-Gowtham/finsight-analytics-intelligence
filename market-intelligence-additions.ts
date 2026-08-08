// ============================================================
// ADD THESE TO THE BOTTOM OF frontend_new/src/lib/api.ts
// ============================================================

export interface MarketPrice {
  BSE: string;
  NSE: string;
}

export interface StockDetails {
  low: string;
  high: string;
  close: string;
  price: string;
  date: string;
  ylow: string;
  yhigh: string;
  NetIncome: string;
  marketCap: string;
}

export interface MarketData {
  current_price: MarketPrice;
  market_cap: string;
  stock_details: StockDetails;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  industry: string;
}

export interface MarketIntelligence {
  ticker: string;
  fetch_date: string;
  source: string;
  market_data: MarketData;
  company_profile: CompanyProfile;
  income_statement?: Record<string, unknown>;
  annual_results?: Record<string, unknown>;
  cash_flow?: Record<string, unknown>;
  fetched_at: string;
}

export async function listMarketIntelligence(): Promise<MarketIntelligence[]> {
  const res = await http<{ success: boolean; data: MarketIntelligence[] }>(
    '/api/market-intelligence'
  );
  return res.data;
}

export async function getMarketIntelligence(ticker: string): Promise<MarketIntelligence> {
  const res = await http<{ success: boolean; data: MarketIntelligence }>(
    `/api/market-intelligence/${ticker}`
  );
  return res.data;
}
