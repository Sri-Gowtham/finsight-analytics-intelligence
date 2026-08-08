import 'dotenv/config';
import { pool } from './src/config/db.js';

async function verify() {
  console.log("=== API & DB VERIFICATION ===");
  try {
    const r = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cfo@finsight.demo', password: 'demo1234' })
    });
    const { token } = await r.json();

    const fetchStatus = async (status) => {
      const p = await fetch(`http://localhost:3001/api/insights?status=${status}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const d = await p.json();
      return d.insights || [];
    };

    const approved = await fetchStatus('approved');
    const rejected = await fetchStatus('rejected');

    console.log(`API returned ${approved.length} approved insights.`);
    if (approved.length > 0) {
      console.log(`First approved note: ${approved[0].rejection_reason}`);
    }

    console.log(`API returned ${rejected.length} rejected insights.`);
    if (rejected.length > 0) {
      console.log(`First rejected note: ${rejected[0].rejection_reason}`);
    }

    const { rows } = await pool.query("SELECT insight_id, approval_status, rejection_reason FROM insights WHERE approval_status IN ('approved', 'rejected') ORDER BY created_at DESC");
    console.log("\nDatabase records:");
    console.table(rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
verify();
