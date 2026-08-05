import {
  BANKS,
  CLIENTS,
  DATA_SOURCES,
  DEMO_PASSWORD,
  INSIGHTS,
  USERS,
} from "./mock-data";
import { STORE_KEYS, collection, readStore, writeStore, clearStore } from "./storage";
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

/**
 * Mock API layer. Every function is async and returns plain data, so each call
 * site can be repointed at a real HTTP/RPC backend without touching UI code.
 */

const latency = (ms = 220) => new Promise((r) => setTimeout(r, ms));

const users = () => collection<User[]>(STORE_KEYS.users, () => USERS);
const clients = () => collection<ClientPortfolio[]>(STORE_KEYS.clients, () => CLIENTS);
const insights = () => collection<Insight[]>(STORE_KEYS.insights, () => INSIGHTS);
const scenarios = () => collection<ScenarioRun[]>(STORE_KEYS.scenarios, () => []);
const dataSources = () => collection<DataSource[]>(STORE_KEYS.dataSources, () => DATA_SOURCES);

/* ------------------------------------------------------------------ auth */

export interface Session {
  userId: string;
  issuedAt: string;
}

export async function login(email: string, password: string): Promise<User> {
  await latency(420);
  const user = users().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) {
    throw new Error("Invalid credentials. Accounts are provisioned by your administrator.");
  }
  if (!user.active) {
    throw new Error("This account has been deactivated. Contact your administrator.");
  }
  writeStore<Session>(STORE_KEYS.session, { userId: user.id, issuedAt: new Date().toISOString() });
  return user;
}

export async function logout() {
  await latency(120);
  clearStore(STORE_KEYS.session);
}

export function currentUserSync(): User | null {
  const session = readStore<Session | null>(STORE_KEYS.session, null);
  if (!session) return null;
  return users().find((u) => u.id === session.userId) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Pick<User, "name" | "title">,
): Promise<User> {
  await latency();
  const next = users().map((u) => (u.id === userId ? { ...u, ...patch } : u));
  writeStore(STORE_KEYS.users, next);
  return next.find((u) => u.id === userId)!;
}

/* ------------------------------------------------------------------ banks */

export async function listBanks(): Promise<Bank[]> {
  await latency();
  return BANKS;
}

export async function getBank(symbol: string): Promise<Bank> {
  await latency();
  const bank = BANKS.find((b) => b.symbol === symbol);
  if (!bank) throw new Error(`Bank ${symbol} is not covered.`);
  return bank;
}

/* ---------------------------------------------------------------- clients */

export async function listClients(): Promise<ClientPortfolio[]> {
  await latency();
  return clients();
}

export async function listClientsForAnalyst(analystId: string): Promise<ClientPortfolio[]> {
  await latency();
  return clients().filter((c) => c.analystIds.includes(analystId));
}

export async function saveClient(
  input: Omit<ClientPortfolio, "id" | "onboardedAt"> & { id?: string },
): Promise<ClientPortfolio> {
  await latency();
  const list = clients();
  if (input.id) {
    const next = list.map((c) => (c.id === input.id ? { ...c, ...input, id: c.id } : c));
    writeStore(STORE_KEYS.clients, next);
    return next.find((c) => c.id === input.id)!;
  }
  const created: ClientPortfolio = {
    ...input,
    id: `c-${Date.now()}`,
    onboardedAt: new Date().toISOString(),
  };
  writeStore(STORE_KEYS.clients, [...list, created]);
  return created;
}

export async function deleteClient(id: string): Promise<void> {
  await latency();
  writeStore(
    STORE_KEYS.clients,
    clients().filter((c) => c.id !== id),
  );
}

/* ------------------------------------------------------------------ users */

export async function listUsers(): Promise<User[]> {
  await latency();
  return users();
}

export async function provisionUser(input: {
  name: string;
  email: string;
  role: Role;
  title: string;
}): Promise<User> {
  await latency();
  const list = users();
  if (list.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("A user with that email already exists.");
  }
  const created: User = {
    ...input,
    id: `u-${Date.now()}`,
    firm: "Meridian Capital Advisory",
    active: true,
    clientIds: [],
    createdAt: new Date().toISOString(),
  };
  writeStore(STORE_KEYS.users, [...list, created]);
  return created;
}

export async function setUserActive(userId: string, active: boolean): Promise<User> {
  await latency();
  const next = users().map((u) => (u.id === userId ? { ...u, active } : u));
  writeStore(STORE_KEYS.users, next);
  return next.find((u) => u.id === userId)!;
}

/* --------------------------------------------------------------- insights */

export async function listInsights(filters?: {
  status?: InsightStatus;
  bankSymbol?: string;
}): Promise<Insight[]> {
  await latency();
  return insights()
    .filter((i) => (filters?.status ? i.status === filters.status : true))
    .filter((i) => (filters?.bankSymbol ? i.bankSymbol === filters.bankSymbol : true))
    .sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
}

export async function getInsight(id: string): Promise<Insight> {
  await latency();
  const found = insights().find((i) => i.id === id);
  if (!found) throw new Error("Insight not found.");
  return found;
}

export async function reviewInsight(input: {
  id: string;
  status: Extract<InsightStatus, "approved" | "rejected">;
  reviewedBy: string;
  reviewNote: string;
}): Promise<Insight> {
  await latency(380);
  const next = insights().map((i) =>
    i.id === input.id
      ? {
          ...i,
          status: input.status,
          reviewedBy: input.reviewedBy,
          reviewNote: input.reviewNote,
          reviewedAt: new Date().toISOString(),
        }
      : i,
  );
  writeStore(STORE_KEYS.insights, next);
  return next.find((i) => i.id === input.id)!;
}

/* -------------------------------------------------------------- scenarios */

export function computeScenario(bank: Bank, inputs: ScenarioInput): ScenarioResult {
  const base = bank.latest;
  const rate = inputs.repoRateDeltaBps / 100;
  const nim = base.nim + rate * 0.32 + inputs.casaDeltaPct * 0.021 - inputs.gnpaDeltaPct * 0.06;
  const creditCost = Math.max(0, inputs.gnpaDeltaPct) * base.advances * 0.0042;
  const growthGain = (inputs.creditGrowthPct / 100) * base.advances * (nim / 100) * 0.42;
  const patCr = Math.max(0, base.pat + growthGain - creditCost + rate * 0.008 * base.pat);
  const roa = Math.max(0.05, (patCr / (base.advances + base.deposits)) * 100 * 1.9);
  const car = Math.max(
    8,
    base.car - inputs.creditGrowthPct * 0.045 - Math.max(0, inputs.gnpaDeltaPct) * 0.22,
  );
  const riskScore = Math.min(
    100,
    Math.max(
      0,
      42 +
        Math.max(0, inputs.gnpaDeltaPct) * 11 +
        Math.max(0, inputs.creditGrowthPct) * 0.5 -
        (nim - base.nim) * 8 -
        (car - 11.5) * 1.6,
    ),
  );
  const verdict =
    riskScore < 40
      ? "Resilient — capital and margin absorb the shock"
      : riskScore < 62
        ? "Manageable — monitor credit cost trajectory"
        : "Stressed — earnings and capital both under pressure";
  const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  return {
    nim: r(nim),
    patCr: r(patCr, 0),
    roa: r(roa),
    car: r(car),
    riskScore: r(riskScore, 0),
    verdict,
  };
}

export function baselineResult(bank: Bank): ScenarioResult {
  return computeScenario(bank, {
    repoRateDeltaBps: 0,
    gnpaDeltaPct: 0,
    creditGrowthPct: 0,
    casaDeltaPct: 0,
  });
}

export async function listScenarioRuns(userId: string): Promise<ScenarioRun[]> {
  await latency();
  return scenarios()
    .filter((s) => s.createdBy === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveScenarioRun(
  run: Omit<ScenarioRun, "id" | "createdAt">,
): Promise<ScenarioRun> {
  await latency(300);
  const created: ScenarioRun = {
    ...run,
    id: `sc-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeStore(STORE_KEYS.scenarios, [created, ...scenarios()]);
  return created;
}

export async function deleteScenarioRun(id: string): Promise<void> {
  await latency();
  writeStore(
    STORE_KEYS.scenarios,
    scenarios().filter((s) => s.id !== id),
  );
}

/* ----------------------------------------------------------- data sources */

export async function listDataSources(): Promise<DataSource[]> {
  await latency();
  return dataSources();
}

export async function updateDataSource(
  id: string,
  patch: Partial<Pick<DataSource, "status" | "refreshCron" | "endpoint">>,
): Promise<DataSource> {
  await latency();
  const next = dataSources().map((d) =>
    d.id === id ? { ...d, ...patch, lastSyncAt: new Date().toISOString() } : d,
  );
  writeStore(STORE_KEYS.dataSources, next);
  return next.find((d) => d.id === id)!;
}
