import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      DELETE FROM bank_financials_raw
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM bank_financials_raw
        GROUP BY company_id, fetch_date
      );
    `);
    await pool.query(`
      ALTER TABLE bank_financials_raw DROP CONSTRAINT IF EXISTS uniq_ticker_date;
      ALTER TABLE bank_financials_raw DROP CONSTRAINT IF EXISTS bank_financials_raw_company_id_fetch_date_key;
      ALTER TABLE bank_financials_raw ADD CONSTRAINT uniq_company_fetch_date UNIQUE (company_id, fetch_date);
    `);
    const res = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'bank_financials_raw';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
