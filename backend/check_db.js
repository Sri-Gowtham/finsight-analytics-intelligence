import 'dotenv/config';
import { pool } from './src/config/db.js';

async function test() {
  const { rows } = await pool.query("SELECT insight_id, approval_status, rejection_reason FROM insights WHERE approval_status IN ('approved', 'rejected')");
  console.log(rows);
  process.exit();
}
test();
