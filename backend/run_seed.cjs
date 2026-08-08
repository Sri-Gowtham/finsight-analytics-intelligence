require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sql = `
-- Add contact details column to client_portfolios
ALTER TABLE client_portfolios
  ADD COLUMN IF NOT EXISTS client_details JSONB;

-- Seed 3 realistic sample clients with multiple banks
INSERT INTO client_portfolios 
  (client_name, company_id, uploaded_by, client_details)
VALUES
  ('Motilal Oswal Wealth', 1, 1, 
   '{"type":"Brokerage","contact_name":"Rahul Sharma","contact_email":"rahul@motilaloswal.in","contact_phone":"+91-22-4054-0000","aum_cr":45000}'),
  ('Motilal Oswal Wealth', 2, 1,
   '{"type":"Brokerage","contact_name":"Rahul Sharma","contact_email":"rahul@motilaloswal.in","contact_phone":"+91-22-4054-0000","aum_cr":45000}'),
  ('Motilal Oswal Wealth', 3, 1,
   '{"type":"Brokerage","contact_name":"Rahul Sharma","contact_email":"rahul@motilaloswal.in","contact_phone":"+91-22-4054-0000","aum_cr":45000}'),

  ('ASK Investment Managers', 1, 1,
   '{"type":"PMS Firm","contact_name":"Priya Menon","contact_email":"priya@askgroup.in","contact_phone":"+91-22-6170-0000","aum_cr":28000}'),
  ('ASK Investment Managers', 4, 1,
   '{"type":"PMS Firm","contact_name":"Priya Menon","contact_email":"priya@askgroup.in","contact_phone":"+91-22-6170-0000","aum_cr":28000}'),
  ('ASK Investment Managers', 5, 1,
   '{"type":"PMS Firm","contact_name":"Priya Menon","contact_email":"priya@askgroup.in","contact_phone":"+91-22-6170-0000","aum_cr":28000}'),

  ('CRISIL Research', 2, 1,
   '{"type":"Credit Rating Agency","contact_name":"Anand Krishnan","contact_email":"anand@crisil.com","contact_phone":"+91-22-3342-0000","aum_cr":0}'),
  ('CRISIL Research', 3, 1,
   '{"type":"Credit Rating Agency","contact_name":"Anand Krishnan","contact_email":"anand@crisil.com","contact_phone":"+91-22-3342-0000","aum_cr":0}');
`;

const verifySql = `
SELECT client_name, 
       COUNT(*) as banks,
       client_details->>'type' as type,
       client_details->>'contact_name' as contact
FROM client_portfolios
GROUP BY client_name, client_details
ORDER BY client_name;
`;

async function run() {
  try {
    await pool.query(sql);
    const { rows } = await pool.query(verifySql);
    console.table(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
