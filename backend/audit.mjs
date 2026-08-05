import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const comps = await pool.query('SELECT * FROM companies');
  const metrics = await pool.query(`
    SELECT c.name, m.metric_name, m.value
    FROM financial_metrics m 
    JOIN companies c ON c.company_id = m.company_id
  `);
  
  fs.writeFileSync('db_audit.json', JSON.stringify({
    companies: comps.rows,
    metrics: metrics.rows
  }, null, 2));

  await pool.end();
}
run().catch(console.error);
