import 'dotenv/config';
import { pool } from './src/config/db.js';

async function run() {
  try {
    const res = await pool.query(`
      SELECT insight_id, company_id, insight_type
      FROM insights 
      WHERE insight_type IS NOT NULL
      LIMIT 3;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
