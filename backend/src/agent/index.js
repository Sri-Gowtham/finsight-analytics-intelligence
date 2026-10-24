import { BANKS } from './banks.js';
import { log } from './logger.js';
import {
  fetchCompanyProfile,
  fetchIncomeStatement,
  fetchAnnualResults,
  fetchCashFlow,
  fetchQuarterlyStats,
} from './fetcher.js';
import { validateResponse } from './validator.js';
import { buildRecord } from './transformer.js';
import { ensureSchema, getCompanyId, upsertFinancials, replaceLiveMetrics } from './storage.js';
import { deriveMetrics } from './metrics.js';

let running = false;

export async function processBank({ ticker, name }) {
  log('INFO', ticker, `Starting processing for ${name}`);
  try {
    const profile = await fetchCompanyProfile(ticker);
    const ttm = await fetchIncomeStatement(ticker);
    const yoy = await fetchAnnualResults(ticker);
    const cashflow = await fetchCashFlow(ticker);
    const quarterly = await fetchQuarterlyStats(ticker);

    const responses = {
      profile: validateResponse(profile, ticker, 'company_profile') ? profile : null,
      ttm_results: validateResponse(ttm, ticker, 'income_statement') ? ttm : null,
      yoy_results: validateResponse(yoy, ticker, 'annual_results') ? yoy : null,
      cashflow: validateResponse(cashflow, ticker, 'cash_flow') ? cashflow : null,
      historical_stats: validateResponse(quarterly, ticker, 'quarterly_results') ? quarterly : null,
    };

    const companyId = await getCompanyId(ticker);
    if (!companyId) {
      log('WARN', ticker, 'Company not found in companies table; skipping');
      return false;
    }

    await upsertFinancials(buildRecord(ticker, companyId, responses));

    const rows = deriveMetrics({ quarterly: responses.historical_stats, profile: responses.profile });
    const written = await replaceLiveMetrics(companyId, rows);
    log('SUCCESS', ticker, `Stored raw data and ${written} live metric rows`);
    return written > 0;
  } catch (err) {
    log('ERROR', ticker, `Processing failed: ${err.message}`);
    return false;
  }
}

export async function refreshAllBanks() {
  if (running) return { skipped: true };
  running = true;
  const started = Date.now();
  try {
    await ensureSchema();
    const results = {};
    for (const bank of BANKS) {
      results[bank.ticker] = await processBank(bank);
    }
    const ok = Object.values(results).filter(Boolean).length;
    log('INFO', 'SYSTEM', `Refresh done: ${ok}/${BANKS.length} banks in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return { skipped: false, results };
  } finally {
    running = false;
  }
}

export function startAgentScheduler() {
  const hours = parseInt(process.env.FETCH_INTERVAL_HOURS || '24', 10);
  if (!process.env.INDIAN_API_KEY) {
    log('WARN', 'SYSTEM', 'INDIAN_API_KEY not set; live data scheduler disabled');
    return;
  }
  log('INFO', 'SYSTEM', `Live data scheduler started, every ${hours}h`);
  // First run shortly after boot, then on the interval.
  setTimeout(() => refreshAllBanks().catch((e) => log('ERROR', 'SYSTEM', e.message)), 30_000);
  setInterval(() => refreshAllBanks().catch((e) => log('ERROR', 'SYSTEM', e.message)), hours * 3600 * 1000);
}
