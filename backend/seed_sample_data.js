import 'dotenv/config';
import { pool } from './src/config/db.js';

async function seed() {
  console.log('--- Seeding Database ---');

  try {
    // 1. Alter clients table
    console.log('Altering clients table...');
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS aum DECIMAL(15,2);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS investment_mandate VARCHAR(50);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_profile VARCHAR(30);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_banks JSONB;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS reporting_frequency VARCHAR(20);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS compliance_notes TEXT;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS holdings JSONB;
    `);

    // 2. Alter insights table
    console.log('Altering insights table...');
    await pool.query(`
      ALTER TABLE insights ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
    `);

    // 3. Insert sample portfolios
    console.log('Inserting sample portfolios...');
    await pool.query(`
      INSERT INTO client_portfolios (client_name, company_id, uploaded_by)
      SELECT 'Ashoka Pension Trust', company_id, (SELECT user_id FROM users WHERE role='Admin' LIMIT 1)
      FROM companies WHERE ticker IN ('HDFCBANK','ICICIBANK','SBIN')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO client_portfolios (client_name, company_id, uploaded_by)
      SELECT 'Varda Family Office', company_id, (SELECT user_id FROM users WHERE role='Admin' LIMIT 1)
      FROM companies WHERE ticker IN ('AXISBANK','KOTAKBANK','HDFCBANK')
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO client_portfolios (client_name, company_id, uploaded_by)
      SELECT 'Meridian Capital Advisory', company_id, (SELECT user_id FROM users WHERE role='Admin' LIMIT 1)
      FROM companies WHERE ticker IN ('ICICIBANK','SBIN','AXISBANK')
      ON CONFLICT DO NOTHING;
    `);

    // 4. Insert sample insights
    console.log('Inserting sample insights...');
    await pool.query(`
      INSERT INTO insights (company_id, generated_text, insight_type, approval_status, created_at)
      SELECT c.company_id,
        'HDFC Bank demonstrates strong capital adequacy with CAR at 17.85%, well above the regulatory minimum of 9%. Net Interest Margin held steady at 4.10%, indicating resilient lending spreads despite rising funding costs. Gross NPA improved marginally to 1.17%, reflecting disciplined credit underwriting.',
        'health_summary', 'pending', NOW() - INTERVAL '2 hours'
      FROM companies c WHERE c.ticker = 'HDFCBANK'
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO insights (company_id, generated_text, insight_type, approval_status, created_at)
      SELECT c.company_id,
        'ICICI Bank peer comparison shows above-sector NIM at 4.45% versus sector average of 3.90%. ROE of 16.2% leads peer group. Loan growth at 14.2% YoY signals strong credit demand absorption without deterioration in asset quality metrics.',
        'peer_comparison', 'pending', NOW() - INTERVAL '5 hours'
      FROM companies c WHERE c.ticker = 'ICICIBANK'
      ON CONFLICT DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO insights (company_id, generated_text, insight_type, approval_status, created_at)
      SELECT c.company_id,
        'State Bank of India What-If scenario: if NPA_percent were reduced from 2.78% to 2.00% through improved recovery mechanisms, estimated ROE improvement of approximately 1.8 percentage points. This is a directional estimate only — not a prediction or guarantee.',
        'whatif_scenario', 'pending', NOW() - INTERVAL '1 day'
      FROM companies c WHERE c.ticker = 'SBIN'
      ON CONFLICT DO NOTHING;
    `);

    console.log('--- Seeding Completed Successfully ---');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await pool.end();
  }
}

seed();
