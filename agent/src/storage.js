import pg from 'pg';
import dotenv from 'dotenv';
import { log } from './logger.js';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initStorage() {
  try {
    await pool.query(`
      ALTER TABLE bank_financials_raw 
      DROP CONSTRAINT IF EXISTS bank_financials_raw_company_id_fetch_date_key;
    `);
    await pool.query(`
      ALTER TABLE bank_financials_raw 
      ADD CONSTRAINT uniq_ticker_date 
      UNIQUE (ticker, fetch_date);
    `);
    log('INFO', 'SYSTEM', 'Added unique constraint uniq_ticker_date to bank_financials_raw');
  } catch (err) {
    if (err.code === '42710') {
      log('INFO', 'SYSTEM', 'Constraint uniq_ticker_date already exists');
    } else {
      log('WARN', 'SYSTEM', `Could not add constraint (might already exist): ${err.message}`);
    }
  }
}

export async function getCompanyId(ticker) {
  const result = await pool.query(`SELECT company_id FROM companies WHERE ticker = $1`, [ticker]);
  return result.rows.length ? result.rows[0].company_id : null;
}

export async function upsertFinancials(record) {
  const query = `
    INSERT INTO bank_financials_raw (
      company_id,
      ticker,
      company_profile,
      market_data,
      income_statement,
      annual_results,
      cash_flow,
      quarterly_results,
      balance_sheet,
      fetched_at,
      fetch_date,
      source
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    ON CONFLICT (ticker, fetch_date) DO UPDATE SET
      company_profile = EXCLUDED.company_profile,
      market_data = EXCLUDED.market_data,
      income_statement = EXCLUDED.income_statement,
      annual_results = EXCLUDED.annual_results,
      cash_flow = EXCLUDED.cash_flow,
      quarterly_results = EXCLUDED.quarterly_results,
      balance_sheet = EXCLUDED.balance_sheet,
      fetched_at = EXCLUDED.fetched_at,
      source = EXCLUDED.source;
  `;

  const values = [
    record.company_id,
    record.ticker,
    record.company_profile,
    record.market_data,
    record.income_statement,
    record.annual_results,
    record.cash_flow,
    record.quarterly_results,
    record.balance_sheet,
    record.fetched_at,
    record.fetch_date,
    record.source
  ];

  await pool.query(query, values);
}
