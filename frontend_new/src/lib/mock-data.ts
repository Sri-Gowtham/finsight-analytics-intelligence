import type {
  Bank,
  ClientPortfolio,
  DataSource,
  Insight,
  MetricPoint,
  User,
} from "./types";

const QUARTERS = [
  "Q1 FY24",
  "Q2 FY24",
  "Q3 FY24",
  "Q4 FY24",
  "Q1 FY25",
  "Q2 FY25",
  "Q3 FY25",
  "Q4 FY25",
];

interface Seed {
  symbol: string;
  name: string;
  segment: Bank["segment"];
  marketCapCr: number;
  price: number;
  changePct: number;
  base: Omit<MetricPoint, "quarter" | "roe" | "revenue" | "profitMargin" | "revenueGrowth"> & Partial<Pick<MetricPoint, "roe" | "revenue" | "profitMargin" | "revenueGrowth">>;
  drift: Partial<Omit<MetricPoint, "quarter">>;
}


const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const SEEDS: Seed[] = [
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    segment: "Private",
    marketCapCr: 1385000,
    price: 1812.4,
    changePct: 0.84,
    base: {
      nim: 3.42,
      gnpa: 1.34,
      nnpa: 0.39,
      car: 18.8,
      casa: 38.2,
      roa: 1.78,
      pat: 15976,
      advances: 2489000,
      deposits: 2378000,
      price: 1512,
    },
    drift: { nim: 0.03, gnpa: 0.02, pat: 620, advances: 42000, deposits: 46000, price: 42 },
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    segment: "Private",
    marketCapCr: 1012000,
    price: 1436.2,
    changePct: 1.12,
    base: {
      nim: 4.36,
      gnpa: 2.16,
      nnpa: 0.42,
      car: 16.7,
      casa: 40.4,
      roa: 2.31,
      pat: 10261,
      advances: 1184000,
      deposits: 1379000,
      price: 1015,
    },
    drift: { nim: -0.04, gnpa: -0.09, pat: 430, advances: 31000, deposits: 34000, price: 54 },
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    segment: "Public",
    marketCapCr: 742000,
    price: 831.6,
    changePct: -0.42,
    base: {
      nim: 3.14,
      gnpa: 2.78,
      nnpa: 0.71,
      car: 14.3,
      casa: 39.9,
      roa: 1.04,
      pat: 16891,
      advances: 3452000,
      deposits: 4830000,
      price: 588,
    },
    drift: { nim: -0.02, gnpa: -0.11, pat: 510, advances: 68000, deposits: 82000, price: 32 },
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank",
    segment: "Private",
    marketCapCr: 356000,
    price: 1152.8,
    changePct: 0.31,
    base: {
      nim: 4.06,
      gnpa: 1.73,
      nnpa: 0.36,
      car: 16.6,
      casa: 42.8,
      roa: 1.83,
      pat: 6035,
      advances: 951000,
      deposits: 1068000,
      price: 962,
    },
    drift: { nim: -0.05, gnpa: -0.04, pat: 210, advances: 22000, deposits: 24000, price: 25 },
  },
  {
    symbol: "KOTAKBANK",
    name: "Kotak Mahindra Bank",
    segment: "Private",
    marketCapCr: 349000,
    price: 1758.9,
    changePct: -0.18,
    base: {
      nim: 5.22,
      gnpa: 1.39,
      nnpa: 0.34,
      car: 20.5,
      casa: 47.7,
      roa: 2.52,
      pat: 4133,
      advances: 376000,
      deposits: 401000,
      price: 1795,
    },
    drift: { nim: -0.09, gnpa: 0.03, pat: 165, advances: 11000, deposits: 12500, price: -6 },
  },
  {
    symbol: "INDUSINDBK",
    name: "IndusInd Bank",
    segment: "Private",
    marketCapCr: 76000,
    price: 978.3,
    changePct: -1.24,
    base: {
      nim: 4.29,
      gnpa: 1.94,
      nnpa: 0.57,
      car: 17.9,
      casa: 39.4,
      roa: 1.86,
      pat: 2202,
      advances: 315000,
      deposits: 353000,
      price: 1432,
    },
    drift: { nim: -0.11, gnpa: 0.09, pat: -95, advances: 8200, deposits: 9600, price: -58 },
  },
  {
    symbol: "BANKBARODA",
    name: "Bank of Baroda",
    segment: "Public",
    marketCapCr: 128000,
    price: 247.5,
    changePct: 0.62,
    base: {
      nim: 3.28,
      gnpa: 3.32,
      nnpa: 0.79,
      car: 15.1,
      casa: 40.1,
      roa: 1.08,
      pat: 4253,
      advances: 1024000,
      deposits: 1266000,
      price: 196,
    },
    drift: { nim: -0.03, gnpa: -0.18, pat: 160, advances: 24000, deposits: 28000, price: 8 },
  },
  {
    symbol: "PNB",
    name: "Punjab National Bank",
    segment: "Public",
    marketCapCr: 114000,
    price: 99.4,
    changePct: 1.87,
    base: {
      nim: 3.02,
      gnpa: 6.98,
      nnpa: 1.47,
      car: 15.4,
      casa: 41.9,
      roa: 0.62,
      pat: 1756,
      advances: 932000,
      deposits: 1298000,
      price: 78,
    },
    drift: { nim: 0.02, gnpa: -0.52, pat: 290, advances: 21000, deposits: 26000, price: 4 },
  },
  {
    symbol: "FEDERALBNK",
    name: "Federal Bank",
    segment: "Private",
    marketCapCr: 48000,
    price: 196.8,
    changePct: 0.44,
    base: {
      nim: 3.18,
      gnpa: 2.26,
      nnpa: 0.62,
      car: 15.2,
      casa: 30.1,
      roa: 1.31,
      pat: 954,
      advances: 197000,
      deposits: 237000,
      price: 148,
    },
    drift: { nim: -0.01, gnpa: -0.06, pat: 38, advances: 6400, deposits: 7600, price: 7 },
  },
  {
    symbol: "IDFCFIRSTB",
    name: "IDFC First Bank",
    segment: "Private",
    marketCapCr: 52000,
    price: 71.2,
    changePct: -0.72,
    base: {
      nim: 6.32,
      gnpa: 2.04,
      nnpa: 0.68,
      car: 16.1,
      casa: 46.8,
      roa: 1.12,
      pat: 716,
      advances: 183000,
      deposits: 189000,
      price: 84,
    },
    drift: { nim: -0.06, gnpa: 0.04, pat: -22, advances: 7800, deposits: 9200, price: -2 },
  },
  {
    symbol: "AUBANK",
    name: "AU Small Finance Bank",
    segment: "Small Finance",
    marketCapCr: 47000,
    price: 632.4,
    changePct: 1.02,
    base: {
      nim: 5.94,
      gnpa: 1.76,
      nnpa: 0.55,
      car: 20.1,
      casa: 34.2,
      roa: 1.62,
      pat: 402,
      advances: 68000,
      deposits: 79000,
      price: 712,
    },
    drift: { nim: -0.08, gnpa: 0.07, pat: 18, advances: 4200, deposits: 5100, price: -11 },
  },
  {
    symbol: "YESBANK",
    name: "Yes Bank",
    segment: "Private",
    marketCapCr: 58000,
    price: 18.9,
    changePct: -0.32,
    base: {
      nim: 2.42,
      gnpa: 2.12,
      nnpa: 0.98,
      car: 15.9,
      casa: 29.7,
      roa: 0.32,
      pat: 231,
      advances: 217000,
      deposits: 245000,
      price: 22,
    },
    drift: { nim: 0.02, gnpa: -0.03, pat: 21, advances: 6200, deposits: 8400, price: -0.5 },
  },
];

function buildHistory(seed: Seed): MetricPoint[] {
  return QUARTERS.map((quarter, i) => {
    const base = { roe: 0, revenue: 0, profitMargin: 0, revenueGrowth: 0, ...seed.base };
    const point: MetricPoint = { quarter, ...base };
    (Object.keys(seed.drift) as (keyof typeof seed.drift)[]).forEach((key) => {
      const delta = seed.drift[key] ?? 0;
      const wobble = key === "price" ? Math.sin(i * 1.3) * Math.abs(delta) * 0.35 : 0;
      const baseVal = base[key] ?? 0;
      (point as unknown as Record<string, unknown>)[key] = round(baseVal + delta * i + wobble, key === "pat" ? 0 : 2);
    });
    point.nnpa = round(Math.max(0.12, point.gnpa * 0.28), 2);
    point.roa = round(Math.max(0.1, base.roa + (point.pat - base.pat) / Math.max(base.pat, 1)), 2);
    point.roe = round(point.roa * (100 / Math.max(point.car, 10)), 2);
    point.revenue = round(point.nim * point.advances * 0.01, 2);
    point.profitMargin = round(point.nim - point.gnpa * 0.6, 2);
    return point;
  });
}

export const BANKS: Bank[] = SEEDS.map((seed) => {
  const history = buildHistory(seed);
  return {
    symbol: seed.symbol,
    name: seed.name,
    segment: seed.segment,
    marketCapCr: seed.marketCapCr,
    price: seed.price,
    changePct: seed.changePct,
    history,
    latest: history[history.length - 1]!,
  };
});

export const USERS: User[] = [
  {
    id: "u-analyst-1",
    name: "Ananya Rao",
    email: "analyst@finsight.in",
    role: "analyst",
    firm: "Meridian Capital Advisory",
    title: "Senior Banking Analyst",
    active: true,
    clientIds: ["c-1", "c-2", "c-3"],
    createdAt: "2025-01-12T09:00:00.000Z",
  },
  {
    id: "u-cfo-1",
    name: "Rajiv Menon",
    email: "cfo@finsight.in",
    role: "cfo",
    firm: "Meridian Capital Advisory",
    title: "Chief Financial Officer",
    active: true,
    clientIds: ["c-1", "c-2", "c-3", "c-4"],
    createdAt: "2025-01-05T09:00:00.000Z",
  },
  {
    id: "u-admin-1",
    name: "Priya Sharma",
    email: "admin@finsight.in",
    role: "admin",
    firm: "Meridian Capital Advisory",
    title: "Platform Administrator",
    active: true,
    clientIds: [],
    createdAt: "2024-12-20T09:00:00.000Z",
  },
  {
    id: "u-analyst-2",
    name: "Karthik Iyer",
    email: "k.iyer@finsight.in",
    role: "analyst",
    firm: "Meridian Capital Advisory",
    title: "Analyst — Public Banks",
    active: true,
    clientIds: ["c-4"],
    createdAt: "2025-03-02T09:00:00.000Z",
  },
  {
    id: "u-analyst-3",
    name: "Meera Nair",
    email: "m.nair@finsight.in",
    role: "analyst",
    firm: "Meridian Capital Advisory",
    title: "Associate Analyst",
    active: false,
    clientIds: [],
    createdAt: "2025-04-18T09:00:00.000Z",
  },
];

export const CLIENTS: ClientPortfolio[] = [
  {
    id: "c-1",
    name: "Ashoka Pension Trust",
    type: "Pension Fund",
    aumCr: 18450,
    bankSymbols: ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK"],
    analystIds: ["u-analyst-1"],
    onboardedAt: "2024-07-11T09:00:00.000Z",
  },
  {
    id: "c-2",
    name: "Varda Family Office",
    type: "Family Office",
    aumCr: 6120,
    bankSymbols: ["AXISBANK", "FEDERALBNK", "AUBANK"],
    analystIds: ["u-analyst-1"],
    onboardedAt: "2024-09-23T09:00:00.000Z",
  },
  {
    id: "c-3",
    name: "Sentinel General Insurance",
    type: "Insurance",
    aumCr: 24870,
    bankSymbols: ["SBIN", "BANKBARODA", "HDFCBANK", "PNB"],
    analystIds: ["u-analyst-1", "u-analyst-2"],
    onboardedAt: "2025-01-30T09:00:00.000Z",
  },
  {
    id: "c-4",
    name: "Nucleus Corporate Treasury",
    type: "Corporate Treasury",
    aumCr: 3980,
    bankSymbols: ["INDUSINDBK", "IDFCFIRSTB", "YESBANK"],
    analystIds: ["u-analyst-2"],
    onboardedAt: "2025-05-06T09:00:00.000Z",
  },
];

export const DATA_SOURCES: DataSource[] = [
  {
    id: "ds-1",
    name: "NSE Market Feed",
    kind: "Market Data",
    endpoint: "https://feed.internal/nse/v3/quotes",
    status: "connected",
    refreshCron: "*/5 * * * 1-5",
    lastSyncAt: "2026-08-05T05:55:00.000Z",
  },
  {
    id: "ds-2",
    name: "Quarterly Filings Ingest",
    kind: "Filings",
    endpoint: "https://feed.internal/filings/v2/banks",
    status: "connected",
    refreshCron: "0 2 * * *",
    lastSyncAt: "2026-08-05T02:00:00.000Z",
  },
  {
    id: "ds-3",
    name: "RBI Regulatory Circulars",
    kind: "Regulatory",
    endpoint: "https://feed.internal/rbi/circulars",
    status: "degraded",
    refreshCron: "0 */6 * * *",
    lastSyncAt: "2026-08-04T18:00:00.000Z",
  },
  {
    id: "ds-4",
    name: "FinSight Insight Engine",
    kind: "AI Model",
    endpoint: "model://finsight-analyst-v4",
    status: "connected",
    refreshCron: "0 3 * * *",
    lastSyncAt: "2026-08-05T03:00:00.000Z",
  },
];

interface InsightSeed {
  id: string;
  bankSymbol: string;
  title: string;
  category: Insight["category"];
  direction: Insight["direction"];
  confidence: number;
  status: Insight["status"];
  analystBody: string;
  executiveSummary: string;
  narrativeBasis: string[];
  trail: Insight["trail"];
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const INSIGHT_SEEDS: InsightSeed[] = [
  {
    id: "ins-1001",
    bankSymbol: "HDFCBANK",
    title: "Deposit repricing is compressing margin faster than loan yields recover",
    category: "Profitability",
    direction: "negative",
    confidence: 0.86,
    status: "pending",
    analystBody:
      "NIM expanded only 21bps across eight quarters while deposit costs rose. Advances grew 13.4% CAGR against deposit growth of 15.1%, so incremental funding is being sourced at higher marginal cost. Margin recovery depends on CASA mix stabilising above 38%.",
    executiveSummary:
      "Core lending profitability at HDFC Bank is improving more slowly than the market expects, because the cost of attracting new deposits is rising faster than the returns on new lending. The franchise remains strong, but near-term earnings upside looks limited.",
    narrativeBasis: [
      "Funding costs have been climbing steadily for two years while lending returns improved only marginally.",
      "Deposit growth is outpacing loan growth, indicating the bank is paying up for liabilities.",
      "The low-cost deposit share has drifted below its own historical comfort band.",
      "Reviewed against eight consecutive reported quarters, with no single-quarter distortion.",
    ],
    trail: [
      {
        step: 1,
        action: "Retrieved reported margin series",
        detail: "Eight-quarter net interest margin trend extracted from filings ingest.",
        source_metric_id: "HDFCBANK.NIM.Q1FY24-Q4FY25",
        metricLabel: "Net Interest Margin",
        value: "3.42% → 3.63%",
      },
      {
        step: 2,
        action: "Computed growth differential",
        detail: "Compared advances CAGR against deposits CAGR over the same window.",
        source_metric_id: "HDFCBANK.ADV_DEP.CAGR",
        metricLabel: "Advances vs Deposits CAGR",
        value: "13.4% vs 15.1%",
        formula: "(latest / earliest)^(4/7) - 1",
      },
      {
        step: 3,
        action: "Checked liability mix",
        detail: "CASA ratio tested against 5-year franchise median of 41.6%.",
        source_metric_id: "HDFCBANK.CASA.Q4FY25",
        metricLabel: "CASA Ratio",
        value: "38.20%",
      },
      {
        step: 4,
        action: "Confidence calibration",
        detail: "Cross-validated with peer margin dispersion; low variance raised confidence.",
        source_metric_id: "PEER.NIM.DISPERSION.PRIVATE",
        metricLabel: "Peer NIM dispersion",
        value: "σ = 0.94",
      },
    ],
    generatedAt: "2026-08-04T06:12:00.000Z",
  },
  {
    id: "ins-1002",
    bankSymbol: "SBIN",
    title: "Asset quality clean-up is now structural, not cyclical",
    category: "Asset Quality",
    direction: "positive",
    confidence: 0.91,
    status: "pending",
    analystBody:
      "GNPA fell from 2.78% to 2.01% with NNPA tracking at a stable 0.28x of GNPA, implying provisioning discipline rather than write-off driven optics. Recovery is broad-based across corporate and SME books.",
    executiveSummary:
      "State Bank of India's loan book quality has improved consistently rather than through one-off clean-ups, which supports a more durable earnings profile. This strengthens the case for holding the position in conservative mandates.",
    narrativeBasis: [
      "Problem loans have declined in every reported quarter of the review window.",
      "The improvement is backed by adequate provisioning rather than accounting write-offs.",
      "Recovery is spread across business segments, not concentrated in one exposure.",
      "Pattern is consistent with sector-wide public bank improvement, reducing single-name risk.",
    ],
    trail: [
      {
        step: 1,
        action: "Retrieved asset quality series",
        detail: "GNPA trend across eight quarters.",
        source_metric_id: "SBIN.GNPA.Q1FY24-Q4FY25",
        metricLabel: "Gross NPA",
        value: "2.78% → 2.01%",
      },
      {
        step: 2,
        action: "Tested provisioning quality",
        detail: "NNPA to GNPA coverage ratio stability check.",
        source_metric_id: "SBIN.NNPA_GNPA.RATIO",
        metricLabel: "NNPA / GNPA",
        value: "0.28x",
        formula: "nnpa / gnpa",
      },
      {
        step: 3,
        action: "Peer benchmarking",
        detail: "Compared against public sector peer set (BANKBARODA, PNB).",
        source_metric_id: "PEER.GNPA.PUBLIC.Q4FY25",
        metricLabel: "Public peer median GNPA",
        value: "3.06%",
      },
    ],
    generatedAt: "2026-08-04T06:14:00.000Z",
  },
  {
    id: "ins-1003",
    bankSymbol: "INDUSINDBK",
    title: "Rising slippages coincide with margin erosion — dual pressure flag",
    category: "Asset Quality",
    direction: "negative",
    confidence: 0.78,
    status: "pending",
    analystBody:
      "GNPA has risen 63bps while NIM contracted 77bps over eight quarters. PAT declined despite advances growth of 25%, indicating credit cost absorption. Capital buffer at 17.9% remains adequate but earnings quality is deteriorating.",
    executiveSummary:
      "IndusInd Bank is facing pressure on two fronts at once: loan quality is weakening while lending profitability shrinks. Capital remains adequate, but earnings reliability has fallen and the exposure warrants review in income-oriented mandates.",
    narrativeBasis: [
      "Loan quality has deteriorated consistently rather than in a single stressed quarter.",
      "Lending profitability has fallen over the same period, removing the usual offset.",
      "Profits declined even as the loan book grew, pointing to higher credit costs.",
      "Capital buffers remain within regulatory comfort, limiting solvency concern.",
    ],
    trail: [
      {
        step: 1,
        action: "Retrieved dual-metric series",
        detail: "Joint GNPA and NIM trajectory analysis.",
        source_metric_id: "INDUSINDBK.GNPA_NIM.Q1FY24-Q4FY25",
        metricLabel: "GNPA / NIM",
        value: "+63bps / -77bps",
      },
      {
        step: 2,
        action: "Earnings decomposition",
        detail: "PAT change tested against advances growth.",
        source_metric_id: "INDUSINDBK.PAT_ADV.DELTA",
        metricLabel: "PAT vs Advances growth",
        value: "-30.2% vs +25.6%",
      },
      {
        step: 3,
        action: "Capital adequacy check",
        detail: "CAR tested against RBI minimum of 11.5%.",
        source_metric_id: "INDUSINDBK.CAR.Q4FY25",
        metricLabel: "Capital Adequacy Ratio",
        value: "17.90%",
      },
    ],
    generatedAt: "2026-08-03T06:10:00.000Z",
  },
  {
    id: "ins-1004",
    bankSymbol: "ICICIBANK",
    title: "Best-in-class return profile is sustainable through FY27",
    category: "Profitability",
    direction: "positive",
    confidence: 0.88,
    status: "approved",
    reviewedBy: "Rajiv Menon",
    reviewedAt: "2026-07-29T11:20:00.000Z",
    reviewNote: "Cleared for client circulation. Language is appropriately hedged.",
    analystBody:
      "ROA sustained above 2.3% with NIM at 4.1% and GNPA falling to 1.53%. Fee income diversification reduces rate sensitivity relative to peers.",
    executiveSummary:
      "ICICI Bank continues to convert its balance sheet into industry-leading returns, supported by diversified income streams that make it less dependent on interest rate cycles. Suitable as a core holding.",
    narrativeBasis: [
      "Returns on the balance sheet have stayed at the top of the private bank cohort.",
      "Income is well diversified beyond lending, reducing rate-cycle dependence.",
      "Loan quality continued improving through the review period.",
    ],
    trail: [
      {
        step: 1,
        action: "Return profile extraction",
        detail: "ROA series across review window.",
        source_metric_id: "ICICIBANK.ROA.Q1FY24-Q4FY25",
        metricLabel: "Return on Assets",
        value: "2.31% → 2.60%",
      },
      {
        step: 2,
        action: "Asset quality confirmation",
        detail: "GNPA improvement validated.",
        source_metric_id: "ICICIBANK.GNPA.Q4FY25",
        metricLabel: "Gross NPA",
        value: "1.53%",
      },
    ],
    generatedAt: "2026-07-28T06:05:00.000Z",
  },
  {
    id: "ins-1005",
    bankSymbol: "KOTAKBANK",
    title: "Margin leadership narrowing as CASA advantage erodes",
    category: "Liquidity",
    direction: "neutral",
    confidence: 0.72,
    status: "approved",
    reviewedBy: "Rajiv Menon",
    reviewedAt: "2026-07-22T09:45:00.000Z",
    reviewNote: "Approved with note: emphasise this is a normalisation, not deterioration.",
    analystBody:
      "NIM declined 63bps from 5.22% as CASA fell toward 44%. Still the highest margin in the private cohort, but the premium is compressing.",
    executiveSummary:
      "Kotak Mahindra Bank still earns the strongest lending margin among large private banks, but its historic funding advantage is normalising. This is a moderation of an outlier position rather than a deterioration.",
    narrativeBasis: [
      "Lending margin remains the highest in its peer group despite recent moderation.",
      "The bank's low-cost deposit advantage has narrowed relative to history.",
      "No change observed in loan quality or capital strength over the period.",
    ],
    trail: [
      {
        step: 1,
        action: "Margin trend",
        detail: "NIM series reviewed.",
        source_metric_id: "KOTAKBANK.NIM.Q1FY24-Q4FY25",
        metricLabel: "Net Interest Margin",
        value: "5.22% → 4.59%",
      },
      {
        step: 2,
        action: "Funding mix",
        detail: "CASA trajectory reviewed.",
        source_metric_id: "KOTAKBANK.CASA.Q4FY25",
        metricLabel: "CASA Ratio",
        value: "44.20%",
      },
    ],
    generatedAt: "2026-07-21T06:02:00.000Z",
  },
  {
    id: "ins-1006",
    bankSymbol: "PNB",
    title: "Turnaround credible but capital efficiency still lags",
    category: "Capital",
    direction: "neutral",
    confidence: 0.69,
    status: "rejected",
    reviewedBy: "Rajiv Menon",
    reviewedAt: "2026-07-16T15:30:00.000Z",
    reviewNote:
      "Rejected — confidence below our 0.75 circulation threshold and the recovery narrative needs one more reported quarter.",
    analystBody:
      "GNPA fell from 6.98% to 3.34% but ROA remains under 1.0%. Recovery is real yet capital returns trail the public peer median.",
    executiveSummary:
      "Punjab National Bank's recovery in loan quality is genuine, but it still converts its balance sheet into weaker returns than comparable public sector banks. Evidence is not yet strong enough for client circulation.",
    narrativeBasis: [
      "Problem loans have fallen sharply from a high base.",
      "Returns generated on the balance sheet remain below the public peer benchmark.",
      "Evidence base is shorter than our standard for a conviction call.",
    ],
    trail: [
      {
        step: 1,
        action: "Asset quality delta",
        detail: "GNPA improvement quantified.",
        source_metric_id: "PNB.GNPA.Q1FY24-Q4FY25",
        metricLabel: "Gross NPA",
        value: "6.98% → 3.34%",
      },
      {
        step: 2,
        action: "Return benchmark",
        detail: "ROA compared with public peer median.",
        source_metric_id: "PEER.ROA.PUBLIC.Q4FY25",
        metricLabel: "Public peer median ROA",
        value: "1.06%",
      },
    ],
    generatedAt: "2026-07-15T06:08:00.000Z",
  },
  {
    id: "ins-1007",
    bankSymbol: "AXISBANK",
    title: "Credit growth funded without margin sacrifice",
    category: "Growth",
    direction: "positive",
    confidence: 0.81,
    status: "pending",
    analystBody:
      "Advances grew 16.2% while NIM held above 3.7% and CASA stayed near 43%, the strongest funding mix in the large private cohort.",
    executiveSummary:
      "Axis Bank is growing its loan book without giving up lending profitability, supported by an unusually strong low-cost deposit base. Constructive for growth-oriented mandates.",
    narrativeBasis: [
      "Loan book expansion has been achieved while holding lending profitability broadly steady.",
      "The bank retains one of the strongest low-cost deposit franchises among large private banks.",
      "Loan quality improved modestly over the same period.",
    ],
    trail: [
      {
        step: 1,
        action: "Growth extraction",
        detail: "Advances growth computed across window.",
        source_metric_id: "AXISBANK.ADVANCES.CAGR",
        metricLabel: "Advances CAGR",
        value: "16.2%",
      },
      {
        step: 2,
        action: "Margin durability check",
        detail: "NIM floor tested.",
        source_metric_id: "AXISBANK.NIM.Q4FY25",
        metricLabel: "Net Interest Margin",
        value: "3.71%",
      },
      {
        step: 3,
        action: "Funding mix",
        detail: "CASA level confirmed.",
        source_metric_id: "AXISBANK.CASA.Q4FY25",
        metricLabel: "CASA Ratio",
        value: "42.80%",
      },
    ],
    generatedAt: "2026-08-02T06:09:00.000Z",
  },
  {
    id: "ins-1008",
    bankSymbol: "BANKBARODA",
    title: "Deposit franchise strength underpins steady re-rating case",
    category: "Growth",
    direction: "positive",
    confidence: 0.76,
    status: "pending",
    analystBody:
      "Deposits grew 15.5% with CASA at 40.1% and GNPA down 126bps. Valuation still below public peer average on price-to-book.",
    executiveSummary:
      "Bank of Baroda is attracting deposits at a healthy pace while cleaning up its loan book, and remains valued below comparable public sector banks. A measured re-rating case exists.",
    narrativeBasis: [
      "Deposit gathering has been consistently strong through the review window.",
      "Loan quality has improved materially from earlier stress levels.",
      "The bank continues to trade at a discount to comparable public sector peers.",
    ],
    trail: [
      {
        step: 1,
        action: "Deposit growth",
        detail: "Deposit CAGR computed.",
        source_metric_id: "BANKBARODA.DEPOSITS.CAGR",
        metricLabel: "Deposits CAGR",
        value: "15.5%",
      },
      {
        step: 2,
        action: "Asset quality delta",
        detail: "GNPA improvement quantified.",
        source_metric_id: "BANKBARODA.GNPA.DELTA",
        metricLabel: "GNPA change",
        value: "-126bps",
      },
    ],
    generatedAt: "2026-08-01T06:07:00.000Z",
  },
];

export const INSIGHTS: Insight[] = INSIGHT_SEEDS.map((seed) => ({
  ...seed,
  model: "finsight-analyst-v4",
}));

export const DEMO_PASSWORD = "finsight123";
