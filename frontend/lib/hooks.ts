import { useState, useCallback, useEffect } from 'react';
import { Bank, BankMetrics, Client, CfoInsight, UserRecord, PortfolioEntry, PortfolioUploadResult } from './types';

// ── Shared utilities ──────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

/** Read the JWT token from the browser cookie set at login. */
function getAuthToken(): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split('; token=');
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? '';
  return '';
}

/** Build fetch options with the Authorization header injected. */
function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Shape adapters ────────────────────────────────────────────────────────────

/**
 * Backend returns metrics as a flat array: [{ metric_name, value, timestamp }]
 * Frontend Bank type expects a nested BankMetrics object.
 *
 * Metric name mapping (backend → frontend):
 *   NIM           → returnOnAssets (closest proxy; NIM is net interest margin)
 *   NPA_percent   → nonPerformingLoansRatio
 *   CAR           → capitalRatio
 *   loan_growth   → loanToDepositRatio (used as a growth indicator)
 *   total_assets  → totalAssets
 *   net_income    → netIncome
 *   ROE           → returnOnEquity
 *   cost_income   → costToIncomeRatio
 */
function adaptMetrics(rows: { metric_name: string; value: string }[]): BankMetrics {
  const m: Record<string, number> = {};
  for (const row of rows) {
    m[row.metric_name] = Number(row.value);
  }
  return {
    totalAssets:              m['total_assets']  ?? m['totalAssets']  ?? 0,
    netIncome:                m['net_income']     ?? m['netIncome']    ?? 0,
    capitalRatio:             m['CAR']            ?? m['capitalRatio'] ?? 0,
    loanToDepositRatio:       m['loan_growth']    ?? m['loanToDepositRatio'] ?? 0,
    nonPerformingLoansRatio:  m['NPA_percent']    ?? m['nonPerformingLoansRatio'] ?? 0,
    returnOnAssets:           m['NIM']            ?? m['returnOnAssets'] ?? 0,
    returnOnEquity:           m['ROE']            ?? m['returnOnEquity'] ?? 0,
    costToIncomeRatio:        m['cost_income']    ?? m['costToIncomeRatio'] ?? 0,
  };
}

/**
 * Backend insights: { insight_id, generated_text, source_metric_ids, created_at }
 * Frontend Insight type: { id, title, description, severity, source, date, aiGenerated }
 */
function adaptInsight(row: {
  insight_id: number | string;
  generated_text: string;
  created_at: string;
  source_metric_ids?: string;
}) {
  return {
    id: String(row.insight_id),
    title: row.generated_text.split('.')[0].trim().slice(0, 80),
    description: row.generated_text,
    severity: 'neutral' as const,
    source: 'financial' as const,
    date: new Date(row.created_at),
    aiGenerated: true,
  };
}

/**
 * Backend companies: { company_id, name, ticker, sector, exchange }
 * Frontend Bank type also needs country, headquarters, founded, employees, metrics, insights, badges.
 * Fields not in the backend are given safe defaults; they are replaced on the
 * Bank Detail page which makes the full metrics + insights fetch.
 */
function adaptCompanyToBank(company: {
  company_id: number | string;
  name: string;
  ticker: string;
  sector: string;
  exchange?: string;
}): Bank {
  return {
    id: String(company.company_id),
    name: company.name,
    ticker: company.ticker,
    country: company.sector ?? '',
    headquarters: company.exchange ?? '',
    founded: 0,
    employees: 0,
    metrics: adaptMetrics([]),
    insights: [],
    badges: [],
  };
}

// ── Bank hooks ────────────────────────────────────────────────────────────────

/** GET /api/companies — list all companies as Bank[] */
export function useBanks() {
  const [data, setData] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ companies: any[] }>('/api/companies');
        if (!cancelled) setData(json.companies.map(adaptCompanyToBank));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/**
 * GET /api/companies/:id/metrics  +  GET /api/companies/:id/insights
 * Combines both calls into a single Bank object.
 */
export function useBankById(id: string) {
  const [data, setData] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const [companiesJson, metricsJson, insightsJson] = await Promise.all([
          apiFetch<{ companies: any[] }>('/api/companies'),
          apiFetch<{ company_id: number; metrics: any[] }>(`/api/companies/${id}/metrics`),
          apiFetch<{ company_id: number; insights: any[] }>(`/api/companies/${id}/insights`),
        ]);
        if (cancelled) return;

        const company = companiesJson.companies.find(
          (c) => String(c.company_id) === String(id),
        );

        const bank: Bank = {
          ...(company ? adaptCompanyToBank(company) : {
            id: String(id), name: '', ticker: '', country: '', headquarters: '',
            founded: 0, employees: 0, badges: [],
          }),
          metrics: adaptMetrics(metricsJson.metrics ?? []),
          insights: (insightsJson.insights ?? []).map(adaptInsight),
        };

        setData(bank);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch bank');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}

// ── Clients hook ──────────────────────────────────────────────────────────────

/**
 * GET /api/clients — returns distinct clients with their companies.
 * Adapted to the legacy Client[] shape: one Client entry per company per client_name.
 */
export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ clients: { client_name: string; companies: any[] }[] }>('/api/clients');
        if (cancelled) return;

        // Flatten: one Client record per (client_name, company) pair.
        // The first client becomes the "focus", the rest are "peer".
        const clients: Client[] = [];
        json.clients.forEach((client, clientIdx) => {
          client.companies.forEach((company, compIdx) => {
            clients.push({
              id: `${client.client_name}-${company.company_id}`,
              bankId: String(company.company_id),
              bankName: company.company_name,
              bankTicker: company.ticker,
              role: clientIdx === 0 && compIdx === 0 ? 'focus' : 'peer',
              addedDate: new Date(),
            });
          });
        });

        setData(clients);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

// ── What-If / Scenario hook ───────────────────────────────────────────────────

/**
 * POST /api/whatif
 * Body: { company_id, metric_name, hypothetical_value }
 * Returns: { success, scenario_id, insight }
 */
export function useCreateScenario() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createScenario = useCallback(async (payload: {
    company_id: string;
    metric_name: string;
    hypothetical_value: number;
  }) => {
    try {
      setIsLoading(true);
      const result = await apiFetch<{ success: boolean; scenario_id: number; insight: string }>(
        '/api/whatif',
        {
          method: 'POST',
          body: JSON.stringify({
            company_id: Number(payload.company_id),
            metric_name: payload.metric_name,
            hypothetical_value: payload.hypothetical_value,
          }),
        },
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create scenario';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createScenario, isLoading, error };
}

// ── CFO Insight hooks ─────────────────────────────────────────────────────────

/** Adapts backend global insight (GET /api/insights) to CfoInsight type */
function adaptCfoInsight(row: any): CfoInsight {
  return {
    id: String(row.insight_id),
    company_name: row.company_name ?? '',
    ticker: row.ticker ?? '',
    generated_text: row.generated_text,
    insight_type: row.approval_status ?? 'pending',
    approval_status: (row.approval_status ?? 'pending') as CfoInsight['approval_status'],
    approved_at: row.approved_at ? new Date(row.approved_at) : undefined,
    rejected_at: row.rejected_at ? new Date(row.rejected_at) : undefined,
    rejection_reason: row.rejection_reason ?? undefined,
    created_at: new Date(row.created_at),
  };
}

/** GET /api/insights?status=pending — CFO-only */
export function useCfoPendingInsights() {
  const [data, setData] = useState<CfoInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ insights: any[] }>('/api/insights?status=pending');
        if (!cancelled) setData(json.insights.map(adaptCfoInsight));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/** GET /api/insights?status=approved — CFO-only */
export function useCfoApprovedInsights() {
  const [data, setData] = useState<CfoInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ insights: any[] }>('/api/insights?status=approved');
        if (!cancelled) setData(json.insights.map(adaptCfoInsight));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/**
 * GET /api/insights?status=pending + GET /api/insights?status=approved
 * Fetches all statuses and filters client-side by id.
 */
export function useCfoInsightById(id: string) {
  const [data, setData] = useState<CfoInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        // Fetch all statuses so we can find by id regardless of current status
        const [pending, approved, rejected] = await Promise.all([
          apiFetch<{ insights: any[] }>('/api/insights?status=pending'),
          apiFetch<{ insights: any[] }>('/api/insights?status=approved'),
          apiFetch<{ insights: any[] }>('/api/insights?status=rejected'),
        ]);
        if (cancelled) return;

        const all = [
          ...pending.insights,
          ...approved.insights,
          ...rejected.insights,
        ];
        const found = all.find((i) => String(i.insight_id) === String(id));
        if (!found) throw new Error('Insight not found');
        setData(adaptCfoInsight(found));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch insight');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}

/** PATCH /api/insights/:id/approve */
export function useApproveInsight() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (insightId: string) => {
    try {
      setIsLoading(true);
      await apiFetch(`/api/insights/${insightId}/approve`, { method: 'PATCH' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve insight';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { approve, isLoading, error };
}

/** PATCH /api/insights/:id/reject */
export function useRejectInsight() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reject = useCallback(async (insightId: string, reason?: string) => {
    try {
      setIsLoading(true);
      await apiFetch(`/api/insights/${insightId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejection_reason: reason ?? '' }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject insight';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { reject, isLoading, error };
}

// ── Admin — User hooks ────────────────────────────────────────────────────────

/** GET /api/admin/users */
export function useUsers() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ users: any[] }>('/api/admin/users');
        if (!cancelled) {
          setData(
            json.users.map((u) => ({
              id: String(u.user_id),
              name: u.name,
              email: u.email,
              role: (u.role as string).toLowerCase() as any,
              is_active: u.is_active ?? true,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/** POST /api/admin/users */
export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (userData: {
    name: string;
    email: string;
    role: 'analyst' | 'cfo' | 'admin';
    password: string;
  }) => {
    try {
      setIsLoading(true);
      // Backend expects Title-case roles: Analyst / CFO / Admin
      const roleMap: Record<string, string> = { analyst: 'Analyst', cfo: 'CFO', admin: 'Admin' };
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...userData, role: roleMap[userData.role] ?? userData.role }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/** PATCH /api/admin/users/:id  — toggle is_active */
export function useDeactivateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivate = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      // First fetch the current status so we can toggle it
      const json = await apiFetch<{ users: any[] }>('/api/admin/users');
      const user = json.users.find((u: any) => String(u.user_id) === String(userId));
      const newStatus = user ? !user.is_active : false;

      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newStatus }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deactivate, isLoading, error };
}

// ── Admin — Portfolio hooks ───────────────────────────────────────────────────

/** GET /api/admin/portfolios */
export function usePortfolios() {
  const [data, setData] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const json = await apiFetch<{ portfolios: any[] }>('/api/admin/portfolios');
        if (!cancelled) {
          setData(
            json.portfolios.map((p) => ({
              id: String(p.id),
              client_name: p.client_name,
              company_id: String(p.company_id),
              bank_name: p.company_name,
              ticker: p.ticker,
              uploaded_by: String(p.uploaded_by),
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch portfolios');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/** POST /api/admin/portfolios */
export function useUploadPortfolio() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    clientName: string,
    bankTickers: string[],
  ): Promise<PortfolioUploadResult> => {
    try {
      setIsLoading(true);
      const result = await apiFetch<PortfolioUploadResult>('/api/admin/portfolios', {
        method: 'POST',
        body: JSON.stringify({ client_name: clientName, bank_tickers: bankTickers }),
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload portfolio';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upload, isLoading, error };
}

/** PUT /api/admin/portfolios/:id */
export function useUpdatePortfolioEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, newCompanyId: string) => {
    try {
      setIsLoading(true);
      await apiFetch(`/api/admin/portfolios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ company_id: Number(newCompanyId) }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update portfolio entry';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/** DELETE /api/admin/portfolios/:id */
export function useDeletePortfolioEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delete_entry = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await apiFetch(`/api/admin/portfolios/${id}`, { method: 'DELETE' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete portfolio entry';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { delete_entry, isLoading, error };
}

// ── Removed hooks (kept as stubs so existing imports don't break) ─────────────

/** @deprecated DataSourceSettings has no backend endpoint — removed from MVP */
export function useDataSourceSettings() {
  return { data: null, isLoading: false, error: null };
}

/** @deprecated DataSourceSettings has no backend endpoint — removed from MVP */
export function useUpdateDataSourceSettings() {
  const update = useCallback(async () => {
    throw new Error('Data source settings endpoint not implemented');
  }, []);
  return { update, isLoading: false, error: null };
}

/** @deprecated Replaced by useCreateScenario */
export function useLocalScenarios() {
  return { data: [], isLoading: false };
}
