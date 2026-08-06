export type Role = "analyst" | "cfo" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  firm: string;
  title: string;
  active: boolean;
  clientIds: string[];
  createdAt: string;
}

export interface MetricPoint {
  quarter: string;
  nim: number;
  gnpa: number;
  nnpa: number;
  car: number;
  casa: number;
  roa: number;
  pat: number;
  advances: number;
  deposits: number;
  price: number;
  /** Derived: Return on Equity ≈ ROA × equity multiplier proxy */
  roe: number;
  /** Derived: Revenue index (normalised from NIM × advances proxy) */
  revenue: number;
  /** Derived: Profit margin ≈ (NIM - credit cost proxy) */
  profitMargin: number;
  /** Derived: Quarter-over-quarter revenue growth % */
  revenueGrowth: number;
}

export interface Bank {
  symbol: string;
  name: string;
  segment: "Private" | "Public" | "Small Finance";
  marketCapCr: number;
  price: number;
  changePct: number;
  latest: MetricPoint;
  history: MetricPoint[];
}

/** Analyst-only verifiable trail step. Never sent to CFO views. */
export interface TrailStep {
  step: number;
  action: string;
  detail: string;
  source_metric_id: string;
  metricLabel: string;
  value: string;
  formula?: string;
}

export type InsightStatus = "pending" | "approved" | "rejected";
export type InsightCategory =
  | "Asset Quality"
  | "Profitability"
  | "Growth"
  | "Capital"
  | "Liquidity";

export interface Insight {
  id: string;
  bankSymbol: string;
  title: string;
  /** Analyst-facing detailed body (may reference metrics). */
  analystBody: string;
  /** CFO-safe executive summary — no raw metrics, formulas or metric ids. */
  executiveSummary: string;
  /** CFO-safe qualitative basis shown behind "Show Basis". */
  narrativeBasis: string[];
  category: InsightCategory;
  direction: "positive" | "negative" | "neutral";
  confidence: number;
  model: string;
  generatedAt: string;
  status: InsightStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  trail: TrailStep[];
}

export interface ClientPortfolio {
  id: string;
  name: string;
  type: "Pension Fund" | "Family Office" | "Insurance" | "Corporate Treasury";
  aumCr: number;
  bankSymbols: string[];
  analystIds: string[];
  onboardedAt: string;
}

export interface ScenarioInput {
  repoRateDeltaBps: number;
  gnpaDeltaPct: number;
  creditGrowthPct: number;
  casaDeltaPct: number;
}

export interface ScenarioResult {
  nim: number;
  patCr: number;
  roa: number;
  car: number;
  riskScore: number;
  verdict: string;
}

export interface ScenarioRun {
  id: string;
  bankSymbol: string;
  name: string;
  inputs: ScenarioInput;
  baseline: ScenarioResult;
  result: ScenarioResult;
  createdAt: string;
  createdBy: string;
}

export interface DataSource {
  id: string;
  name: string;
  kind: "Market Data" | "Filings" | "Regulatory" | "AI Model";
  endpoint: string;
  status: "connected" | "degraded" | "disabled";
  refreshCron: string;
  lastSyncAt: string;
}
