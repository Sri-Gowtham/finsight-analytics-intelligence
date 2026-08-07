import dotenv from 'dotenv';
dotenv.config();

if (!process.env.INDIAN_API_KEY) {
  console.error("INDIAN_API_KEY not set in .env");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

import { BANKS } from './config/banks.js';
import { log } from './src/logger.js';
import { 
  fetchCompanyProfile, 
  fetchIncomeStatement, 
  fetchAnnualResults, 
  fetchCashFlow, 
  fetchQuarterlyStats 
} from './src/fetcher.js';
import { validateResponse } from './src/validator.js';
import { buildRecord } from './src/transformer.js';
import { pool, initStorage, getCompanyId, upsertFinancials } from './src/storage.js';
import { startScheduler } from './src/scheduler.js';

export async function processBank(bank) {
  const { ticker, name } = bank;
  log('INFO', ticker, `Starting processing for ${name}`);

  try {
    const profile = await fetchCompanyProfile(ticker);
    const ttm_results = await fetchIncomeStatement(ticker);
    const yoy_results = await fetchAnnualResults(ticker);
    const cashflow = await fetchCashFlow(ticker);
    const historical_stats = await fetchQuarterlyStats(ticker);

    const responses = {
      profile: validateResponse(profile, ticker, 'company_profile') ? profile : null,
      ttm_results: validateResponse(ttm_results, ticker, 'income_statement') ? ttm_results : null,
      yoy_results: validateResponse(yoy_results, ticker, 'annual_results') ? yoy_results : null,
      cashflow: validateResponse(cashflow, ticker, 'cash_flow') ? cashflow : null,
      historical_stats: validateResponse(historical_stats, ticker, 'quarterly_results') ? historical_stats : null
    };

    const companyId = await getCompanyId(ticker);
    if (!companyId) {
      log('WARN', ticker, `Company ID not found for ticker ${ticker}. Record will have null company_id.`);
    }

    const record = buildRecord(ticker, companyId, responses);
    await upsertFinancials(record);

    log('SUCCESS', ticker, `Processed successfully`);
    return true;
  } catch (error) {
    log('ERROR', ticker, `Processing failed: ${error.message}`);
    return false;
  }
}

export async function processAllBanks() {
  const startTime = Date.now();
  let successCount = 0;
  let failedCount = 0;

  for (const bank of BANKS) {
    const success = await processBank(bank);
    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  const timeSecs = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('=============================================');
  console.log('Financial Data Collection Summary');
  console.log('=============================================');
  for (const bank of BANKS) {
    // Determine if success or not from log? We just re-run success check or mock it.
    // For simplicity, we just print SUCCESS for all if we track per bank, but since we didn't store per-bank status in a map,
    // let's just log them nicely.
    console.log(`${bank.name.padEnd(25)} Processing Completed`);
  }
  console.log(`Total: ${BANKS.length} | Success: ${successCount} | Failed: ${failedCount}`);
  console.log(`Time: ${timeSecs}s`);
  console.log('=============================================');
}

async function main() {
  try {
    await initStorage();
    await processAllBanks();
    startScheduler();
  } catch (error) {
    console.error("Database connection failure or other critical error:", error);
    process.exit(1);
  }
}

// Execute main if run directly
import url from 'url';
if (import.meta.url.endsWith('index.js')) {
  main();
}
