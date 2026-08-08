import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
dotenv.config();

async function run() {
  try {
    const res = await pool.query(`
      SELECT insight_id, company_id, insight_type,
        generated_text IS NOT NULL as has_text,
        source_metric_ids,
        created_at
      FROM insights
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
