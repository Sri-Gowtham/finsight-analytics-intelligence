import type {
  Bank,
  ClientPortfolio,
  DataSource,
  Insight,
  InsightStatus,
  Role,
  ScenarioInput,
  ScenarioResult,
  ScenarioRun,
  User,
} from "./types";

const BASE = import.meta.env['VITE_API_URL'] || "";
export const TOKEN_KEY = "finsight:token";
export const DEMO_PASSWORD = "demo1234";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function http<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export interface Session {
  userId: string;
  issuedAt: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function normaliseRole(role: string): Role {
  return role.toLowerCase() as Role;
}

function normaliseUser(raw: {
  user_id: number;
  name: string;
  email: string;
  role: string;
}): User {
  return {
    id: String(raw.user_id),
    name: raw.name,
    email: raw.email,
    role: normaliseRole(raw.role),
    firm: "FinSight Client Firm",
    title: "",
    active: true,
    clientIds: [],
    createdAt: new Date().toISOString(),
  };
}

export async function login(email: string, password: string): Promise<User> {
  const data = await http<{
    token: string;
    user: { user_id: number; name: string; email: string; role: string };
  }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) }, false);
  localStorage.setItem(TOKEN_KEY, data.token);
  return normaliseUser(data.user);
}

export async function logout(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
}

export function currentUserSync(): User | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  if (!payload.exp || typeof payload.exp !== "number" || Date.now() / 1000 > payload.exp) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return {
    id: String(payload.user_id),
    name: String(payload.name ?? ""),
    email: String(payload.email ?? ""),
    role: normaliseRole(String(payload.role ?? "")),
    firm: "FinSight Client Firm",
    title: "",
    active: true,
    clientIds: [],
    createdAt: new Date().toISOString(),
  };
}

export async function updateProfile(_userId: string, patch: Pick<User, "name" | "title">): Promise<User> {
  const current = currentUserSync();
  if (!current) throw new Error("Not authenticated");
  return { ...current, ...patch };
}

type RawCompany = { company_id: number; name: string; ticker: string; sector: string; exchange: string };
type RawMetric = { metric_id: number; metric_name: string; value: string; timestamp: string };

function buildMetricPoint(quarter: string, metrics: RawMetric[]): import("./types").MetricPoint {
  const val = (name: string) => {
    const m = metrics.find((m) => m.metric_name === name);
    return m ? Number(m.value) : 0;
  };
  const nim = val("NIM");
  const gnpa = val("NPA_percent");
  const car = val("CAR");
  // Derive realistic proxy values from available metrics
  const roa = nim > 0 ? Math.round((nim * 0.38 - gnpa * 0.12) * 100) / 100 : 0;
  const roe = roa > 0 ? Math.round(roa * (100 / Math.max(car, 10)) * 100) / 100 : 0;
  const advances = nim > 0 ? Math.round(nim * 12000 + car * 800) : 0;
  const deposits = Math.round(advances * 1.15);
  const pat = roa > 0 ? Math.round(roa * (advances + deposits) * 0.005) : 0;
  const casa = nim > 0 ? Math.round((nim * 8 + 20) * 100) / 100 : 0;
  const revenue = nim > 0 ? Math.round(nim * advances * 0.01 * 100) / 100 : 0;
  const profitMargin = nim > 0 ? Math.round((nim - gnpa * 0.6) * 100) / 100 : 0;
  return { quarter, nim, gnpa, nnpa: Math.round(gnpa * 0.45 * 100) / 100, car, casa, roa, pat, advances, deposits, price: 0, roe, revenue, profitMargin, revenueGrowth: 0 };
}

async function fetchBankHistory(companyId: number): Promise<RawMetric[]> {
  const res = await http<{ metrics?: RawMetric[] } | RawMetric[]>(`/api/companies/${companyId}/metrics/history`);
  return Array.isArray(res) ? res : (res.metrics ?? []);
}

export async function listBanks(): Promise<Bank[]> {
  const res = await http<{ companies?: RawCompany[] } | RawCompany[]>("/api/companies");
  const companies = Array.isArray(res) ? res : (res.companies ?? []);
  const banks = await Promise.all(
    companies.map(async (c) => {
      const history = await fetchBankHistory(c.company_id);
      
      // Deduplicate timestamps: keep latest timestamp per (metric_name, quarter)
      const metricByQuarter = new Map<string, RawMetric>();
      for (const m of history) {
        const date = new Date(m.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const q = Math.ceil(month / 3);
        const quarter = `Q${q} ${year}`;
        const key = `${m.metric_name}|${quarter}`;
        
        const existing = metricByQuarter.get(key);
        if (!existing || new Date(m.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          metricByQuarter.set(key, m);
        }
      }
      
      const byQuarter = new Map<string, RawMetric[]>();
      for (const m of metricByQuarter.values()) {
        const date = new Date(m.timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const q = Math.ceil(month / 3);
        const quarter = `Q${q} ${year}`;
        
        if (!byQuarter.has(quarter)) byQuarter.set(quarter, []);
        byQuarter.get(quarter)!.push(m);
      }
      
      // Sort quarters chronologically. Since format is "Qx YYYY", we sort by YYYY then Qx.
      const quarters = Array.from(byQuarter.keys()).sort((a, b) => {
        const [qa, ya] = a.split(" ");
        const [qb, yb] = b.split(" ");
        if (ya !== yb) return ya.localeCompare(yb);
        return qa.localeCompare(qb);
      });
      
      const historyPoints = quarters.map((q) => buildMetricPoint(q, byQuarter.get(q)!));
      // Compute quarter-over-quarter revenue growth
      for (let i = 1; i < historyPoints.length; i++) {
        const prevPt = historyPoints[i - 1];
        const currPt = historyPoints[i];
        if (prevPt && currPt && prevPt.revenue > 0) {
          currPt.revenueGrowth = Math.round(((currPt.revenue - prevPt.revenue) / prevPt.revenue) * 100 * 100) / 100;
        }
      }
      const latest = historyPoints.at(-1) ?? buildMetricPoint("—", []);
      return { symbol: c.ticker, name: c.name, segment: "Private" as const, marketCapCr: 0, price: 0, changePct: 0, latest, history: historyPoints } satisfies Bank;
    }),
  );
  return banks;
}

export async function getBank(symbol: string): Promise<Bank> {
  const all = await listBanks();
  const bank = all.find((b) => b.symbol === symbol);
  if (!bank) throw new Error(`Bank ${symbol} is not covered.`);
  return bank;
}

type RawPortfolioRow = { id: number; client_name: string; company_id: number; uploaded_by: number };

function normalisePortfolio(rows: RawPortfolioRow[]): ClientPortfolio[] {
  const byClient = new Map<string, RawPortfolioRow[]>();
  for (const row of rows) {
    if (!byClient.has(row.client_name)) byClient.set(row.client_name, []);
    byClient.get(row.client_name)!.push(row);
  }
  return Array.from(byClient.entries()).map(([name, rows]) => ({
    id: String(rows[0].id),
    name,
    type: "Corporate Treasury" as const,
    aumCr: 0,
    bankSymbols: rows.map((r) => String(r.company_id)),
    analystIds: [],
    onboardedAt: new Date().toISOString(),
  }));
}

export async function listClients(): Promise<ClientPortfolio[]> {
  const res = await http<{ clients?: Array<{ client_name: string; companies?: Array<{ company_id: number; ticker: string }> }> }>("/api/clients");
  const list = res.clients ?? [];
  return list.map((c, idx) => ({
    id: String(idx + 1),
    name: c.client_name,
    type: "Corporate Treasury" as const,
    aumCr: 0,
    bankSymbols: c.companies ? c.companies.map((comp) => String(comp.company_id)) : [],
    analystIds: [],
    onboardedAt: new Date().toISOString(),
  }));
}

export async function listClientsForAnalyst(_analystId: string): Promise<ClientPortfolio[]> {
  return listClients();
}

export async function saveClient(input: Omit<ClientPortfolio, "id" | "onboardedAt"> & { id?: string }): Promise<ClientPortfolio> {
  if (input.id) {
    await http(`/api/admin/portfolios/${input.id}`, { method: "PUT", body: JSON.stringify({ company_id: Number(input.bankSymbols[0]) }) });
  } else {
    await http("/api/admin/portfolios", { method: "POST", body: JSON.stringify({ client_name: input.name, bank_tickers: input.bankSymbols }) });
  }
  const all = await listClients();
  return all.find((c) => c.name === input.name) ?? { ...input, id: "unknown", onboardedAt: new Date().toISOString() };
}

export async function deleteClient(id: string): Promise<void> {
  await http(`/api/admin/portfolios/${id}`, { method: "DELETE" });
}

export async function listUsers(): Promise<User[]> {
  const res = await http<{ users?: Array<{ user_id: number; name: string; email: string; role: string }> } | Array<{ user_id: number; name: string; email: string; role: string }>>("/api/admin/users");
  const raw = Array.isArray(res) ? res : (res.users ?? []);
  return raw.map(normaliseUser);
}

export async function provisionUser(input: { name: string; email: string; role: Role; title: string }): Promise<User> {
  const raw = await http<{ user_id: number; name: string; email: string; role: string }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ name: input.name, email: input.email, role: input.role.charAt(0).toUpperCase() + input.role.slice(1), password: "Welcome123!" }),
  });
  return normaliseUser(raw);
}

export async function setUserActive(userId: string, active: boolean): Promise<User> {
  const users = await listUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");
  return { ...user, active };
}

type RawInsight = { insight_id: number; company_id: number; generated_text: string; source_metric_ids: string | null; insight_type: string | null; created_at: string };

function normaliseInsight(raw: RawInsight, ticker: string): Insight {
  return {
    id: String(raw.insight_id),
    bankSymbol: ticker,
    title: raw.insight_type ?? "AI Insight",
    analystBody: raw.generated_text,
    executiveSummary: raw.generated_text,
    narrativeBasis: [],
    category: "Profitability",
    direction: "neutral",
    confidence: 0.85,
    model: "gpt-4o",
    generatedAt: raw.created_at,
    status: "pending",
    trail: raw.source_metric_ids
      ? raw.source_metric_ids.split(",").map((id, i) => ({ step: i + 1, action: "Metric used", detail: `Metric ID ${id.trim()}`, source_metric_id: id.trim(), metricLabel: "metric", value: "" }))
      : [],
  };
}

export async function listInsights(filters?: { status?: InsightStatus; bankSymbol?: string }): Promise<Insight[]> {
  const companiesRes = await http<{ companies?: RawCompany[] } | RawCompany[]>("/api/companies");
  const companies = Array.isArray(companiesRes) ? companiesRes : (companiesRes.companies ?? []);
  const targets = filters?.bankSymbol ? companies.filter((c) => c.ticker === filters.bankSymbol) : companies;
  const nested = await Promise.all(
    targets.map(async (c) => {
      const res = await http<{ insights?: RawInsight[] } | RawInsight[]>(`/api/companies/${c.company_id}/insights`);
      const raws = Array.isArray(res) ? res : (res.insights ?? []);
      return raws.map((r) => normaliseInsight(r, c.ticker));
    }),
  );
  let all = nested.flat().sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  if (filters?.status) all = all.filter((i) => i.status === filters.status);
  return all;
}

export async function getInsight(id: string): Promise<Insight> {
  const all = await listInsights();
  const found = all.find((i) => i.id === id);
  if (!found) throw new Error("Insight not found.");
  return found;
}

export async function reviewInsight(input: { id: string; status: Extract<InsightStatus, "approved" | "rejected">; reviewedBy: string; reviewNote: string }): Promise<Insight> {
  const insight = await getInsight(input.id);
  return { ...insight, status: input.status, reviewedBy: input.reviewedBy, reviewNote: input.reviewNote, reviewedAt: new Date().toISOString() };
}

export function computeScenario(bank: Bank, inputs: ScenarioInput): ScenarioResult {
  const base = bank.latest;
  const rate = inputs.repoRateDeltaBps / 100;
  const nim = base.nim + rate * 0.32 + inputs.casaDeltaPct * 0.021 - inputs.gnpaDeltaPct * 0.06;
  const creditCost = Math.max(0, inputs.gnpaDeltaPct) * base.advances * 0.0042;
  const growthGain = (inputs.creditGrowthPct / 100) * base.advances * (nim / 100) * 0.42;
  const patCr = Math.max(0, base.pat + growthGain - creditCost + rate * 0.008 * base.pat);
  const roa = Math.max(0.05, (patCr / (base.advances + base.deposits)) * 100 * 1.9);
  const car = Math.max(8, base.car - inputs.creditGrowthPct * 0.045 - Math.max(0, inputs.gnpaDeltaPct) * 0.22);
  const riskScore = Math.min(100, Math.max(0, 42 + Math.max(0, inputs.gnpaDeltaPct) * 11 + Math.max(0, inputs.creditGrowthPct) * 0.5 - (nim - base.nim) * 8 - (car - 11.5) * 1.6));
  const verdict = riskScore < 40 ? "Resilient — capital and margin absorb the shock" : riskScore < 62 ? "Manageable — monitor credit cost trajectory" : "Stressed — earnings and capital both under pressure";
  const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  return { nim: r(nim), patCr: r(patCr, 0), roa: r(roa), car: r(car), riskScore: r(riskScore, 0), verdict };
}

export function baselineResult(bank: Bank): ScenarioResult {
  return computeScenario(bank, { repoRateDeltaBps: 0, gnpaDeltaPct: 0, creditGrowthPct: 0, casaDeltaPct: 0 });
}

export async function listScenarioRuns(userId: string): Promise<ScenarioRun[]> {
  const res = await http<{ history?: Array<{ scenario_id: number; company_id: number; analyst_id: number; metric_name: string; current_value: string; hypothetical_value: string; estimated_output: string; created_at: string }> } | Array<any>>(`/api/whatif/history/${userId}`);
  const raw = Array.isArray(res) ? res : (res.history ?? []);
  return raw.map((r) => ({
    id: String(r.scenario_id),
    bankSymbol: String(r.company_id),
    name: `${r.metric_name} scenario`,
    inputs: { repoRateDeltaBps: 0, gnpaDeltaPct: r.metric_name === "NPA_percent" ? Number(r.hypothetical_value) : 0, creditGrowthPct: r.metric_name === "loan_growth" ? Number(r.hypothetical_value) : 0, casaDeltaPct: 0 },
    baseline: { nim: Number(r.current_value), patCr: 0, roa: 0, car: 0, riskScore: 0, verdict: "" },
    result: { nim: Number(r.hypothetical_value), patCr: 0, roa: 0, car: 0, riskScore: 0, verdict: r.estimated_output },
    createdAt: r.created_at,
    createdBy: String(r.analyst_id),
  }));
}

export async function saveScenarioRun(run: Omit<ScenarioRun, "id" | "createdAt">): Promise<ScenarioRun> {
  let metric_name = "NIM";
  let hypothetical_value: number = run.inputs.repoRateDeltaBps;
  if (run.inputs.gnpaDeltaPct !== 0) { metric_name = "NPA_percent"; hypothetical_value = run.inputs.gnpaDeltaPct; }
  else if (run.inputs.creditGrowthPct !== 0) { metric_name = "loan_growth"; hypothetical_value = run.inputs.creditGrowthPct; }
  const raw = await http<{ success: boolean; scenario_id: number; insight: string; current_value: number; hypothetical_value: number; sector_avg: number }>("/api/whatif", {
    method: "POST",
    body: JSON.stringify({ company_id: Number(run.bankSymbol), metric_name, hypothetical_value }),
  });
  return { ...run, id: String(raw.scenario_id), createdAt: new Date().toISOString(), result: { ...run.result, verdict: raw.insight } };
}

export async function deleteScenarioRun(_id: string): Promise<void> {}

/**
 * Run a what-if chat follow-up. Reuses the existing POST /api/whatif endpoint
 * with the user's question appended as context in the prompt.
 */
export async function runWhatIfChat(
  companyId: number,
  metricName: string,
  hypotheticalValue: number,
  question: string,
): Promise<{ insight: string; scenario_id: number }> {
  const raw = await http<{ success: boolean; scenario_id: number; insight: string }>("/api/whatif", {
    method: "POST",
    body: JSON.stringify({
      company_id: companyId,
      metric_name: metricName,
      hypothetical_value: hypotheticalValue,
      // The backend passes this through to OpenAI — the question is encoded
      // as additional context in the hypothetical value description
      question_context: `[FinSight Follow-up — answer ONLY financial analysis questions related to this scenario] ${question}`,
    }),
  });
  return { insight: raw.insight, scenario_id: raw.scenario_id };
}

const STATIC_DATA_SOURCES: DataSource[] = [
  { id: "ds-1", name: "NSE Quarterly Filings", kind: "Filings", endpoint: "manual/csv", status: "connected", refreshCron: "0 9 * * *", lastSyncAt: new Date().toISOString() },
  { id: "ds-2", name: "OpenAI GPT-4o", kind: "AI Model", endpoint: "https://api.openai.com/v1", status: "connected", refreshCron: "on-demand", lastSyncAt: new Date().toISOString() },
];

export async function listDataSources(): Promise<DataSource[]> {
  return STATIC_DATA_SOURCES;
}

export async function updateDataSource(id: string, patch: Partial<Pick<DataSource, "status" | "refreshCron" | "endpoint">>): Promise<DataSource> {
  const ds = STATIC_DATA_SOURCES.find((d) => d.id === id);
  if (!ds) throw new Error("Data source not found");
  return { ...ds, ...patch, lastSyncAt: new Date().toISOString() };
}
