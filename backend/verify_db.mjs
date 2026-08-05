import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pool.query('BEGIN');
  try {
    console.log('=== STEP 1: AUDITING & CLEANING TEST DATA ===');
    const badComps = await pool.query("SELECT company_id, name, ticker FROM companies WHERE ticker NOT IN ('HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK') OR name LIKE '%TestBank%' OR name LIKE '%OtherBank%'");
    
    if (badComps.rows.length === 0) {
      console.log('No fictional or test bank rows found in companies table.');
    } else {
      console.log(`Found ${badComps.rows.length} unwanted company rows:`, badComps.rows.map(r => `${r.name} (${r.ticker})`));
      const badIds = badComps.rows.map(r => r.company_id);
      const idList = badIds.map((_, i) => `$${i + 1}`).join(',');

      const tablesToCheck = ['bank_financials', 'financial_metrics', 'insights', 'client_portfolios', 'whatif_scenarios'];
      for (const table of tablesToCheck) {
        try {
          const checkRes = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE company_id IN (${idList})`, badIds);
          const count = parseInt(checkRes.rows[0].count, 10);
          if (count > 0) {
            const delRes = await pool.query(`DELETE FROM ${table} WHERE company_id IN (${idList})`, badIds);
            console.log(`Removed ${delRes.rowCount} dependent rows from ${table}.`);
          } else {
            console.log(`Checked ${table}: 0 dependent rows found.`);
          }
        } catch (err) {
          console.log(`Table ${table} does not exist or has no company_id column (${err.message}).`);
        }
      }

      const delComps = await pool.query(`DELETE FROM companies WHERE company_id IN (${idList})`, badIds);
      console.log(`Removed ${delComps.rowCount} rows from companies table.`);
    }

    console.log('\n=== STEP 2: RE-CONFIRMING COMPANIES TABLE ===');
    const comps = await pool.query('SELECT * FROM companies ORDER BY company_id');
    console.log(`Total companies in DB: ${comps.rows.length}`);
    console.table(comps.rows);

    console.log('\n=== STEP 3: RE-CONFIRMING METRIC VALUES ===');
    const metrics = await pool.query(`
      SELECT c.ticker, c.name, m.metric_name, m.value, m.timestamp 
      FROM financial_metrics m
      JOIN companies c ON c.company_id = m.company_id
      ORDER BY c.ticker, m.metric_name
    `);
    
    console.log(`Total financial_metrics entries for real banks: ${metrics.rows.length}`);
    const summary = {};
    metrics.rows.forEach(r => {
      if (!summary[r.ticker]) summary[r.ticker] = { name: r.name };
      summary[r.ticker][r.metric_name] = parseFloat(r.value);
    });
    console.table(summary);

    // Also check bank_financials if it exists
    try {
      const bf = await pool.query(`
        SELECT c.ticker, bf.* 
        FROM bank_financials bf
        JOIN companies c ON c.company_id = bf.company_id
      `);
      console.log(`Total bank_financials entries: ${bf.rows.length}`);
      if (bf.rows.length > 0) console.table(bf.rows);
    } catch (err) {
      console.log('Note: bank_financials table is not present or empty:', err.message);
    }

    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in script:', err);
  } finally {
    await pool.end();
  }
}

run();
