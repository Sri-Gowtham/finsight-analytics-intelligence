import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting Phase 2 Migration...');
    await client.query('BEGIN');

    // Create the new bank_financials_raw table
    await client.query(`
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
        source VARCHAR(50) DEFAULT 'Yahoo Finance',
        UNIQUE (company_id, fetched_at)
      );
    `);

    // In order to allow UPSERT per day, we need an index on (company_id, DATE(fetched_at)) 
    // Wait, Postgres UNIQUE constraints don't support DATE(fetched_at) easily without a functional index,
    // but functional indexes can't be used directly in ON CONFLICT (unless specified carefully).
    // An alternative is a column 'fetch_date DATE DEFAULT CURRENT_DATE' and UNIQUE (company_id, fetch_date).
    
    // Let's modify the schema slightly to ensure robust daily UPSERTs
    await client.query(`
      ALTER TABLE bank_financials_raw ADD COLUMN IF NOT EXISTS fetch_date DATE DEFAULT CURRENT_DATE;
    `);
    
    // We'll just drop the old unique constraint and add the new one if we can, but since this is new,
    // we will just drop the table and recreate it to be safe (since it's empty).
    await client.query(`DROP TABLE IF EXISTS bank_financials_raw;`);
    
    await client.query(`
      CREATE TABLE bank_financials_raw (
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
        source VARCHAR(50) DEFAULT 'Yahoo Finance',
        UNIQUE (company_id, fetch_date)
      );
    `);

    await client.query('COMMIT');
    console.log('Phase 2 Migration Complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
