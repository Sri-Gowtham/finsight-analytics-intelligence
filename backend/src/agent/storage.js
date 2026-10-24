import { pool } from '../config/db.js';

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_financials_raw (
      id SERIAL PRIMARY KEY,
      company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
      ticker VARCHAR(50) NOT NULL,
      company_profile JSONB,
      market_data JSONB,
      income_statement JSONB,
      balance_sheet JSONB,
      cash_flow JSONB,
      quarterly_results JSONB,
      annual_results JSONB,
      fetched_at TIMESTAMP DEFAULT NOW(),
      fetch_date DATE DEFAULT CURRENT_DATE,
      source VARCHAR(50) DEFAULT 'indianapi.in',
      UNIQUE (company_id, fetch_date)
    )
  `);
}

export async function getCompanyId(ticker) {
  const { rows } = await pool.query('SELECT company_id FROM companies WHERE ticker = $1', [ticker]);
  return rows.length ? rows[0].company_id : null;
}

export async function upsertFinancials(record) {
  await pool.query(
    `INSERT INTO bank_financials_raw (
       company_id, ticker, company_profile, market_data, income_statement,
       annual_results, cash_flow, quarterly_results, balance_sheet,
       fetched_at, fetch_date, source
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (company_id, fetch_date) DO UPDATE SET
       company_profile = EXCLUDED.company_profile,
       market_data = EXCLUDED.market_data,
       income_statement = EXCLUDED.income_statement,
       annual_results = EXCLUDED.annual_results,
       cash_flow = EXCLUDED.cash_flow,
       quarterly_results = EXCLUDED.quarterly_results,
       balance_sheet = EXCLUDED.balance_sheet,
       fetched_at = EXCLUDED.fetched_at,
       source = EXCLUDED.source`,
    [
      record.company_id, record.ticker, record.company_profile, record.market_data,
      record.income_statement, record.annual_results, record.cash_flow,
      record.quarterly_results, record.balance_sheet, record.fetched_at,
      record.fetch_date, record.source,
    ],
  );
}

/**
 * Replace the live metric rows for one company. Only the metric names we
 * derive are touched, so any other rows in financial_metrics stay as they are.
 */
export async function replaceLiveMetrics(companyId, rows) {
  if (!rows.length) return 0;
  const names = [...new Set(rows.map((r) => r.metric_name))];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM financial_metrics WHERE company_id = $1 AND metric_name = ANY($2)',
      [companyId, names],
    );
    for (const r of rows) {
      await client.query(
        'INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES ($1,$2,$3,$4)',
        [companyId, r.metric_name, r.value, r.timestamp],
      );
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
