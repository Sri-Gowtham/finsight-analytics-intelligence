import 'dotenv/config';
import { pool } from './src/config/db.js';

async function seedHistory() {
  console.log("Seeding CFO Approval History records...");
  try {
    // Get 2 insights to use
    const { rows } = await pool.query("SELECT insight_id FROM insights LIMIT 2");
    
    if (rows.length < 2) {
      console.log("Not enough insights found to seed.");
      return;
    }

    const cfoRes = await pool.query("SELECT user_id FROM users WHERE role = 'CFO' LIMIT 1");
    const cfoId = cfoRes.rows[0]?.user_id || 2;

    const insightId1 = rows[0].insight_id;
    const insightId2 = rows[1].insight_id;

    // Set Insight 1 to approved
    await pool.query(
      `UPDATE insights 
       SET approval_status = 'approved', 
           approved_at = NOW() - INTERVAL '1 day', 
           reviewed_by = $1, 
           rejected_at = NULL, 
           rejection_reason = 'Excellent report. All metrics are solid and align with expectations.' 
       WHERE insight_id = $2`,
      [cfoId, insightId1]
    );

    // Set Insight 2 to rejected
    await pool.query(
      `UPDATE insights 
       SET approval_status = 'rejected', 
           rejected_at = NOW() - INTERVAL '2 hours', 
           reviewed_by = $1, 
           approved_at = NULL, 
           rejection_reason = 'NIM calculation looks incorrect based on Q3 earnings. Please recalculate.' 
       WHERE insight_id = $2`,
      [cfoId, insightId2]
    );

    console.log(`✅ Seeded Insight ${insightId1} as APPROVED with note.`);
    console.log(`✅ Seeded Insight ${insightId2} as REJECTED with note.`);
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await pool.end();
  }
}

seedHistory();
