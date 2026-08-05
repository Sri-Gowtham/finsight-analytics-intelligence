export type UserRole = 'analyst' | 'cfo' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface BankMetrics {
  totalAssets: number;
  netIncome: number;
  capitalRatio: number;
  loanToDepositRatio: number;
  nonPerformingLoansRatio: number;
  returnOnAssets: number;
  returnOnEquity: number;
  costToIncomeRatio: number;
}

export interface Bank {
  id: string;
  name: string;
  ticker: string;
  country: string;
  headquarters: string;
  founded: number;
  employees: number;
  metrics: BankMetrics;
  insights: Insight[];
  badges: Badge[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  source: 'regulatory' | 'market' | 'financial' | 'operational';
  date: Date;
  aiGenerated?: boolean;
}

export interface CfoInsight {
  id: string;
  company_name: string;
  ticker: string;
  generated_text: string;
  insight_type: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  metric_types?: string[];
}

export interface Badge {
  id: string;
  label: string;
  color: 'emerald' | 'blue' | 'amber' | 'gray';
  icon: string;
}

export interface PeerComparisonMetric {
  metric: string;
  value: number;
  percentile: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HistoricalDataPoint {
  date: Date;
  metrics: Partial<BankMetrics>;
}

export interface Client {
  id: string;
  bankId: string;
  bankName: string;
  bankTicker: string;
  role: 'focus' | 'peer' | 'archive';
  addedDate: Date;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  bankId: string;
  parameters: ScenarioParameters;
  results: ScenarioResults;
  createdDate: Date;
}

export interface ScenarioParameters {
  assetChange: number; // percentage
  incomeChange: number; // percentage
  riskChange: number; // percentage
  operationalChange: number; // percentage
}

export interface ScenarioResults {
  capitalRatioChange: number;
  profitabilityImpact: number;
  riskScoreChange: number;
  recommendations: string[];
}

export interface UserRecord extends User {
  is_active: boolean;
}

export interface PortfolioEntry {
  id: string;
  client_name: string;
  company_id: string;
  bank_name: string;
  ticker: string;
  uploaded_by: string;
}

export interface PortfolioUploadResult {
  success: boolean;
  client_name: string;
  inserted_count: number;
  skipped_duplicates: number;
  failed_tickers: string[];
}

export interface DataSourceSettings {
  api_key: string;
  last_connection_test: Date | null;
  connection_status: 'connected' | 'disconnected';
}
