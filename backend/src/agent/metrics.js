/**
 * Derive financial_metrics rows from live API data only.
 * NIM, Gross NPA, CAR and CASA are not provided by the data source and are
 * deliberately NOT produced; the UI shows them as N/A.
 */

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// "Sep 2026" -> last day of that month (UTC)
function periodEnd(label) {
  const [mon, year] = String(label).trim().split(/\s+/);
  if (!(mon in MONTHS) || !/^\d{4}$/.test(year)) return null;
  return new Date(Date.UTC(Number(year), MONTHS[mon] + 1, 0));
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function keyMetric(profile, regex) {
  const groups = profile?.keyMetrics ?? {};
  for (const items of Object.values(groups)) {
    if (!Array.isArray(items)) continue;
    const hit = items.find((i) => regex.test(i.key ?? '') && num(i.value) !== null);
    if (hit) return num(hit.value);
  }
  return null;
}

export function deriveMetrics({ quarterly, profile }) {
  const rows = [];
  const push = (metric_name, value, date) => {
    if (value === null || !Number.isFinite(value) || !date) return;
    rows.push({ metric_name, value: Math.round(value * 10000) / 10000, timestamp: date });
  };

  const revenue = quarterly?.['Revenue'] ?? {};
  const profit = quarterly?.['Net Profit'] ?? {};
  const eps = quarterly?.['EPS in Rs'] ?? {};
  const pbt = quarterly?.['Profit before tax'] ?? {};
  const finMargin = quarterly?.['Financing Margin %'] ?? {};

  const periods = Object.keys(revenue)
    .map((label) => ({ label, date: periodEnd(label) }))
    .filter((p) => p.date)
    .sort((a, b) => a.date - b.date);

  let prevRevenue = null;
  for (const { label, date } of periods) {
    const rev = num(revenue[label]);
    const np = num(profit[label]);
    push('Revenue', rev, date);
    push('NetProfit', np, date);
    push('EPS', num(eps[label]), date);
    push('ProfitBeforeTax', num(pbt[label]), date);
    push('FinancingMargin', num(finMargin[label]), date);
    if (rev && np !== null) push('ProfitMargin', (np / rev) * 100, date);
    if (prevRevenue && rev) push('RevenueGrowth', ((rev - prevRevenue) / prevRevenue) * 100, date);
    if (rev) prevRevenue = rev;
  }

  // Point-in-time figures belong to the latest reported quarter.
  const latest = periods.at(-1)?.date;
  if (latest) {
    push('ROA', keyMetric(profile, /^returnOnAverageAssetsTrailing12Month/), latest);
    push('ROE', keyMetric(profile, /^returnOnAverageEquityTrailing12Month/), latest);
    push('PE', keyMetric(profile, /^pPerEExcludingExtraordinaryItemsMostRecentFiscalYear/), latest);
    push('PriceToBook', keyMetric(profile, /^priceToBookMostRecentFiscalYear/), latest);
    push('MarketCap', keyMetric(profile, /^marketCap$/), latest);
    push('Price', num(profile?.currentPrice?.NSE ?? profile?.currentPrice?.BSE), latest);
  }
  return rows;
}
