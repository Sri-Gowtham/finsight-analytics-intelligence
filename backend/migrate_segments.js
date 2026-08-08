import 'dotenv/config';
import { pool } from './src/config/db.js';

async function fixSegments() {
  // Add segment column if it doesn't exist
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS segment VARCHAR(50) DEFAULT 'Private'`);
  console.log('✅ Added segment column');

  // Set all to Private by default (correct for most NSE private banks)
  await pool.query(`UPDATE companies SET segment = 'Private' WHERE segment IS NULL OR segment = 'Private'`);
  
  // Set public sector banks
  await pool.query(`UPDATE companies SET segment = 'Public' WHERE ticker IN ('SBIN', 'BANKBARODA', 'PNB', 'CANBK', 'UNIONBANK', 'BOIIND')`);
  console.log('✅ Set public sector banks');

  // Show result
  const res = await pool.query('SELECT ticker, name, sector, segment FROM companies ORDER BY ticker');
  console.log('\nFinal company segments:');
  res.rows.forEach(r => console.log(`  ${r.ticker}: sector=${r.sector} | segment=${r.segment}`));

  process.exit(0);
}
fixSegments().catch(err => { console.error(err); process.exit(1); });
