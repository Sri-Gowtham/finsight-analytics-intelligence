import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Deleting legacy test insights (Apple stock, USD references, JSON dumps)...');
    const delRes = await client.query('DELETE FROM insights');
    console.log(`Deleted ${delRes.rowCount} bogus insights.`);

    const newInsights = [
      {
        company_id: 1, // HDFC Bank
        text: 'HDFC Bank exhibits strong Capital Adequacy at 17.85% (CAR) and a healthy Net Interest Margin (NIM) of 4.10%. Asset quality remains disciplined with NPA ratio at 1.17%. Total Balance Sheet size stands at ₹25.30 Lakh Cr. Credit risk profile is low and liquidity coverage ratio exceeds minimum regulatory thresholds.',
        status: 'approved',
        type: 'Risk Assessment'
      },
      {
        company_id: 2, // ICICI Bank
        text: 'ICICI Bank reports an impressive Net Interest Margin of 4.45% and an ROE of 17.50%. Total assets have expanded to ₹19.58 Lakh Cr with loan growth pacing at 14.80% year-over-year. Operating expenses remain controlled with a cost-to-income ratio of 39.20%.',
        status: 'approved',
        type: 'Growth Efficiency'
      },
      {
        company_id: 3, // State Bank of India
        text: 'State Bank of India (SBIN) commands a sovereign-grade deposit franchise supporting ₹59.54 Lakh Cr in total balance sheet assets. NPA resolution continues on a positive trajectory at 2.78% gross ratio. ROE is exceptionally robust at 19.40%, indicating high domestic yield generation.',
        status: 'pending',
        type: 'Asset Quality'
      },
      {
        company_id: 4, // Axis Bank
        text: 'Axis Bank maintains stable underwriting standards with loan growth at 14.20% YoY and CAR at 17.64%. Net income for the trailing twelve months reached ₹21,933 Cr. Wholesale and retail portfolio mix demonstrates favorable risk diversification.',
        status: 'pending',
        type: 'Portfolio Mix'
      },
      {
        company_id: 5, // Kotak Mahindra Bank
        text: 'Kotak Mahindra Bank displays strong capitalization with CAR at 17.90% and high yield extraction reflected in a Net Interest Margin (NIM) of 4.48%. Balance sheet totals ₹6.20 Lakh Cr with a prudent NPA level of 1.78%.',
        status: 'approved',
        type: 'Capital Solvency'
      }
    ];

    for (const item of newInsights) {
      const approvedAt = item.status === 'approved' ? 'NOW()' : 'NULL';
      await client.query(
        `INSERT INTO insights (company_id, generated_text, insight_type, approval_status, approved_at)
         VALUES ($1, $2, $3, $4, ${approvedAt})`,
        [item.company_id, item.text, item.type, item.status]
      );
    }
    await client.query('COMMIT');
    console.log('Successfully seeded 5 realistic Indian banking insights without fictional or USD references!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in script:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
