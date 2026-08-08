require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT insight_id, company_id, 
             LEFT(generated_text,50) as preview,
             source_metric_ids,
             insight_type,
             created_at
      FROM insights
      ORDER BY created_at DESC LIMIT 5;
    `);
    console.table(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
