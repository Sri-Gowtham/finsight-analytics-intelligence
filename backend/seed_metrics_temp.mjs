import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // 1. Confirm current state
    console.log("=== 1. CONFIRM CURRENT STATE ===");
    let res = await pool.query('SELECT company_id, metric_name, timestamp, value FROM financial_metrics ORDER BY company_id, metric_name, timestamp');
    console.log(`Current rows in financial_metrics: ${res.rows.length}`);
    if (res.rows.length > 0) {
       const uniqueTimestamps = [...new Set(res.rows.map(r => new Date(r.timestamp).toISOString().substring(0,10)))];
       console.log(`Timestamps present: ${uniqueTimestamps.join(', ')}`);
    }

    res = await pool.query('SELECT company_id, name, ticker FROM companies ORDER BY company_id');
    const companies = res.rows;
    console.log("Companies:", companies);

    const companyMap = {};
    for (const c of companies) {
      companyMap[c.ticker] = c.company_id;
    }

    // 2. Seed Script
    console.log("\n=== 2. SEED SCRIPT ===");
    
    const quarters = [
        '2024-10-01',
        '2025-01-01',
        '2025-04-01',
        '2025-07-01',
        '2025-10-01',
        '2026-01-01',
        '2026-04-01',
        '2026-07-01'
    ];

    const dataToInsert = [];

    const baseValues = {
        'HDFCBANK': { NIM: 4.2, NPA: 1.5, CAR: 18.0, loanGrowth: 14.0 },
        'ICICIBANK': { NIM: 4.0, NPA: 1.8, CAR: 17.0, loanGrowth: 13.0 },
        'SBIN': { NIM: 3.4, NPA: 3.2, CAR: 14.5, loanGrowth: 11.0 },
        'AXISBANK': { NIM: 3.8, NPA: 2.2, CAR: 16.0, loanGrowth: 12.0 },
        'KOTAKBANK': { NIM: 4.4, NPA: 1.6, CAR: 18.5, loanGrowth: 13.0 },
    };

    for (let qIdx = 0; qIdx < quarters.length; qIdx++) {
        const qDate = quarters[qIdx];
        const isQ1 = qDate.includes('-01-01');
        const isQ3Q4 = qDate.includes('-07-01') || qDate.includes('-10-01');
        
        for (const ticker of Object.keys(baseValues)) {
            const cId = companyMap[ticker];
            if (!cId) continue;
            
            const base = baseValues[ticker];
            
            // NIM
            let nim = base.NIM;
            if (['HDFCBANK', 'ICICIBANK', 'KOTAKBANK'].includes(ticker)) {
                nim += qIdx * 0.05;
            } else {
                nim += (Math.random() * 0.1 - 0.05);
            }
            nim = Math.round(nim * 100) / 100;
            
            // NPA
            let npa = base.NPA - (qIdx * 0.04);
            npa = Math.round(npa * 100) / 100;
            
            // CAR
            let car = base.CAR + (Math.random() * 0.5 - 0.25);
            car = Math.round(car * 100) / 100;
            
            // loan_growth
            let lg = base.loanGrowth;
            if (isQ1) lg -= (Math.random() * 1.5 + 0.5);
            if (isQ3Q4) lg += (Math.random() * 1.5 + 0.5);
            else lg += (Math.random() * 1.0 - 0.5);
            lg = Math.round(lg * 100) / 100;
            
            dataToInsert.push({ cId, mName: 'NIM', date: qDate, value: nim });
            dataToInsert.push({ cId, mName: 'NPA_percent', date: qDate, value: npa });
            dataToInsert.push({ cId, mName: 'CAR', date: qDate, value: car });
            dataToInsert.push({ cId, mName: 'loan_growth', date: qDate, value: lg });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const data of dataToInsert) {
            await client.query(`
                INSERT INTO financial_metrics (company_id, metric_name, timestamp, value)
                SELECT $1::integer, $2::varchar, $3::varchar, $4::numeric
                WHERE NOT EXISTS (
                    SELECT 1 FROM financial_metrics 
                    WHERE company_id = $1::integer AND metric_name = $2::varchar AND timestamp = $3::varchar
                )
            `, [data.cId, data.mName, data.date, data.value]);
        }
        await client.query('COMMIT');
        console.log("Data seeded successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error seeding data:", e);
    } finally {
        client.release();
    }

    // 3. Verify
    console.log("\n=== 3. VERIFY ===");
    res = await pool.query(`
        SELECT metric_name, COUNT(*) as rows, 
             MIN(timestamp) as earliest, MAX(timestamp) as latest
        FROM financial_metrics
        GROUP BY metric_name
        ORDER BY metric_name;
    `);
    console.log("Counts per metric:");
    console.table(res.rows);

    console.log("\nSpot-check for NIM:");
    res = await pool.query(`
        SELECT c.ticker, fm.metric_name, fm.value, fm.timestamp
        FROM financial_metrics fm
        JOIN companies c ON fm.company_id = c.company_id
        WHERE fm.metric_name = 'NIM'
        ORDER BY c.ticker, fm.timestamp;
    `);
    
    for (const r of res.rows) {
        const d = new Date(r.timestamp).toISOString().substring(0,10);
        console.log(`${r.ticker} | ${r.metric_name} | ${r.value} | ${d}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
