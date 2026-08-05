import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pool.query('BEGIN');
  try {
    console.log('Altering value column precision...');
    await pool.query('ALTER TABLE financial_metrics ALTER COLUMN value TYPE DECIMAL(20,4)');

    // 1. Delete all metrics
    console.log('Deleting all financial_metrics...');
    await pool.query('DELETE FROM financial_metrics');
    
    // 1.5 Delete child records for test companies
    console.log('Cleaning child records for test companies...');
    const badCompaniesQuery = "SELECT company_id FROM companies WHERE ticker NOT IN ('HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK')";
    await pool.query(`DELETE FROM insights WHERE company_id IN (${badCompaniesQuery})`);
    await pool.query(`DELETE FROM client_portfolios WHERE company_id IN (${badCompaniesQuery})`);

    // 2. Delete test companies (all except the 5 valid NSE banks)
    console.log('Cleaning companies table...');
    const delRes = await pool.query(`DELETE FROM companies WHERE company_id IN (${badCompaniesQuery})`);
    console.log(`Deleted ${delRes.rowCount} test companies`);
    
    // 3. Get the IDs of the 5 valid banks
    const comps = await pool.query("SELECT company_id, ticker FROM companies");
    const idMap = {};
    comps.rows.forEach(c => idMap[c.ticker] = c.company_id);
    
    if (Object.keys(idMap).length !== 5) {
      throw new Error(`Expected 5 companies, found ${Object.keys(idMap).length}`);
    }

    // 4. Seed realistic metrics for all 5 banks
    // NIM ~3-4.5%, NPA_percent ~1-4%, CAR ~13-18%, loan_growth ~8-15%, net_income, total_assets, ROE, cost_income
    console.log('Seeding financial metrics...');
    const now = new Date().toISOString();
    
    const banksData = {
      'HDFCBANK':  { NIM: 4.10, NPA_percent: 1.17, CAR: 17.85, loan_growth: 14.5, total_assets: 2530000, net_income: 45997, ROE: 17.0, cost_income: 40.5 },
      'ICICIBANK': { NIM: 4.45, NPA_percent: 2.81, CAR: 17.50, loan_growth: 14.8, total_assets: 1958000, net_income: 31896, ROE: 17.5, cost_income: 39.2 },
      'SBIN':      { NIM: 3.37, NPA_percent: 2.78, CAR: 14.68, loan_growth: 13.8, total_assets: 5954000, net_income: 50232, ROE: 19.4, cost_income: 53.9 },
      'AXISBANK':  { NIM: 4.02, NPA_percent: 2.02, CAR: 17.64, loan_growth: 14.2, total_assets: 1317000, net_income: 21933, ROE: 18.2, cost_income: 45.8 },
      'KOTAKBANK': { NIM: 4.48, NPA_percent: 1.78, CAR: 17.90, loan_growth: 14.9, total_assets: 620000,  net_income: 10939, ROE: 14.5, cost_income: 47.9 }
    };
    
    for (const [ticker, metrics] of Object.entries(banksData)) {
      const cid = idMap[ticker];
      for (const [metric_name, value] of Object.entries(metrics)) {
        await pool.query(
          'INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES ($1, $2, $3, $4)',
          [cid, metric_name, value, now]
        );
      }
    }
    
    await pool.query('COMMIT');
    console.log('DB seed complete. Inserted realistic metrics for all 5 banks.');
  } catch(e) {
    await pool.query('ROLLBACK');
    console.error('Error during DB seed, rolled back:', e);
  } finally {
    await pool.end();
  }
}
run();
