import { pool } from '../../config/db.js';
import { logger } from '../logger/index.js';

export async function upsertBankFinancials(normalizedData) {
  const {
    ticker,
    company_profile,
    market_data,
    income_statement,
    balance_sheet,
    cash_flow,
    quarterly_results,
    annual_results
  } = normalizedData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get the company_id for this ticker (stripping .NS if present, as DB tickers don't have it)
    const dbTicker = ticker.replace('.NS', '');
    const companyRes = await client.query('SELECT company_id FROM companies WHERE ticker = $1', [dbTicker]);
    if (companyRes.rows.length === 0) {
      throw new Error(`Company with ticker ${dbTicker} not found in companies table.`);
    }
    const companyId = companyRes.rows[0].company_id;

    // 2. UPSERT the financial data
    const query = `
      INSERT INTO bank_financials_raw (
        company_id, ticker, company_profile, market_data, 
        income_statement, balance_sheet, cash_flow, 
        quarterly_results, annual_results, fetch_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
      ON CONFLICT (company_id, fetch_date) 
      DO UPDATE SET
        company_profile = EXCLUDED.company_profile,
        market_data = EXCLUDED.market_data,
        income_statement = EXCLUDED.income_statement,
        balance_sheet = EXCLUDED.balance_sheet,
        cash_flow = EXCLUDED.cash_flow,
        quarterly_results = EXCLUDED.quarterly_results,
        annual_results = EXCLUDED.annual_results,
        fetched_at = NOW()
      RETURNING id;
    `;
    
    const values = [
      companyId, ticker, JSON.stringify(company_profile), JSON.stringify(market_data),
      JSON.stringify(income_statement), JSON.stringify(balance_sheet), JSON.stringify(cash_flow),
      JSON.stringify(quarterly_results), JSON.stringify(annual_results)
    ];

    const result = await client.query(query, values);
    
    await client.query('COMMIT');
    logger.info(`Upserted database record successfully for ${ticker} (ID: ${result.rows[0].id})`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Database UPSERT failed for ${ticker}`, error);
    throw error;
  } finally {
    client.release();
  }
}
