// Seeds demo insights, analyst reports and notifications so the CFO dashboard,
// pending-approvals queue and approval history are populated.
//
// Every figure in the insight text is read from financial_metrics (live data), and each
// insight stores the metric ids it was built from, so the audit trail stays honest.
// Usage: node seed_cfo_demo.mjs   (aborts if insights or client_reports already contain rows)
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const inr = (n) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const p2 = (n) => Number(n).toFixed(2);

// Text builders: v = latest value per metric name for the bank.
const TEXT = {
  profitability: (name, v) =>
    `${name} reports a trailing-twelve-month return on equity of ${p2(v.ROE)}% and return on assets of ${p2(v.ROA)}%. ` +
    `The latest quarter delivered net profit of ₹${inr(v.NetProfit)} Cr, a ${p2(v.ProfitMargin)}% net profit margin.`,
  profitabilityNoRoe: (name, v) =>
    `${name} earned a net profit of ₹${inr(v.NetProfit)} Cr in the latest quarter, a ${p2(v.ProfitMargin)}% net profit margin. ` +
    `Earnings per share for the quarter were ₹${p2(v.EPS)}.`,
  growth: (name, v) =>
    `${name} posted quarterly revenue of ₹${inr(v.Revenue)} Cr, ${p2(v.RevenueGrowth)}% higher than the previous quarter, ` +
    `with net profit of ₹${inr(v.NetProfit)} Cr and earnings per share of ₹${p2(v.EPS)}.`,
  efficiency: (name, v) =>
    `${name} converted ${p2(v.ProfitMargin)}% of quarterly revenue into net profit. Revenue grew ${p2(v.RevenueGrowth)}% quarter on quarter ` +
    `and earnings per share stood at ₹${p2(v.EPS)}.`,
  valuation: (name, v) =>
    `${name} trades at ₹${p2(v.Price)} on the NSE, a price-to-earnings multiple of ${p2(v.PE)}, with earnings per share of ₹${p2(v.EPS)}. ` +
    `This is a descriptive snapshot of reported figures, not a view on the share price.`,
};

const SPECS = [
  { status: 'pending',  ticker: 'HDFCBANK',  type: 'Profitability',   text: 'profitability', metrics: ['ROE', 'ROA', 'ProfitMargin', 'NetProfit'], daysAgo: 0.3 },
  { status: 'pending',  ticker: 'SBIN',      type: 'Earnings Growth', text: 'growth',        metrics: ['Revenue', 'RevenueGrowth', 'NetProfit', 'EPS'], daysAgo: 0.6 },
  { status: 'pending',  ticker: 'AXISBANK',  type: 'Efficiency',      text: 'efficiency',    metrics: ['ProfitMargin', 'RevenueGrowth', 'EPS'], daysAgo: 1.1 },
  { status: 'approved', ticker: 'ICICIBANK', type: 'Profitability',   text: 'profitability', metrics: ['ROE', 'ROA', 'ProfitMargin', 'NetProfit'], daysAgo: 3, note: 'Figures reconcile with the stored metrics.' },
  { status: 'approved', ticker: 'KOTAKBANK', type: 'Valuation',       text: 'valuation',     metrics: ['Price', 'PE', 'EPS'], daysAgo: 4, note: 'Looks good.' },
  { status: 'approved', ticker: 'HDFCBANK',  type: 'Valuation',       text: 'valuation',     metrics: ['Price', 'PE', 'EPS'], daysAgo: 6, note: 'Neutral wording, cleared for clients.' },
  { status: 'rejected', ticker: 'SBIN',      type: 'Valuation',       text: 'valuation',     metrics: ['Price', 'PE', 'EPS'], daysAgo: 5, reason: 'Reads too close to a view on the share price. Rework as a neutral peer comparison.' },
  { status: 'rejected', ticker: 'AXISBANK',  type: 'Earnings Growth', text: 'growth',        metrics: ['Revenue', 'RevenueGrowth', 'NetProfit', 'EPS'], daysAgo: 7, reason: 'Peer context is missing. Add the sector average before client release.' },
];

async function main() {
  const existing = await pool.query(
    `SELECT (SELECT count(*) FROM insights)::int AS insights, (SELECT count(*) FROM client_reports)::int AS reports`,
  );
  if (existing.rows[0].insights > 0 || existing.rows[0].reports > 0) {
    console.log('insights/client_reports already contain data; nothing seeded.', existing.rows[0]);
    return;
  }

  const users = (await pool.query('SELECT user_id, role FROM users')).rows;
  const analystId = users.find((u) => u.role === 'Analyst')?.user_id;
  const cfoId = users.find((u) => u.role === 'CFO')?.user_id;
  if (!analystId || !cfoId) throw new Error('Demo Analyst and CFO users are required.');

  const companies = (await pool.query('SELECT company_id, ticker, name FROM companies')).rows;
  const byTicker = Object.fromEntries(companies.map((c) => [c.ticker, c]));

  // latest value + metric id per metric for a bank
  const latest = async (companyId) => {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (metric_name) metric_id, metric_name, value
         FROM financial_metrics WHERE company_id = $1 ORDER BY metric_name, timestamp DESC`,
      [companyId],
    );
    return Object.fromEntries(rows.map((r) => [r.metric_name, { id: r.metric_id, value: Number(r.value) }]));
  };

  const client = await pool.connect();
  const created = [];
  try {
    await client.query('BEGIN');

    for (const s of SPECS) {
      const co = byTicker[s.ticker];
      if (!co) throw new Error(`Company ${s.ticker} not found`);
      const m = await latest(co.company_id);
      const missing = s.metrics.filter((k) => !m[k]);
      if (missing.length) throw new Error(`${s.ticker} is missing live metrics: ${missing.join(', ')}`);
      const v = Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x.value]));
      const text = TEXT[s.text](co.name, v);
      const ids = s.metrics.map((k) => m[k].id).join(',');
      const createdAt = new Date(Date.now() - s.daysAgo * 86400000);
      const reviewedAt = new Date(createdAt.getTime() + 3 * 3600000);

      const { rows } = await client.query(
        `INSERT INTO insights
           (company_id, generated_text, insight_type, approval_status, approved_at, rejected_at,
            rejection_reason, reviewed_by, created_at, source_metric_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING insight_id`,
        [
          co.company_id, text, s.type, s.status,
          s.status === 'approved' ? reviewedAt : null,
          s.status === 'rejected' ? reviewedAt : null,
          s.status === 'approved' ? (s.note ?? null) : s.status === 'rejected' ? s.reason : null,
          s.status === 'pending' ? null : cfoId,
          createdAt, ids,
        ],
      );
      created.push({ ...s, id: rows[0].insight_id });
    }

    const idOf = (status, ticker) => created.find((c) => c.status === status && c.ticker === ticker)?.id;

    const portfolios = (await client.query('SELECT DISTINCT client_name FROM client_portfolios ORDER BY client_name')).rows
      .map((r) => r.client_name);
    const clientName = (i) => portfolios[i % Math.max(portfolios.length, 1)] ?? 'Demo Client Portfolio';

    const REPORTS = [
      { status: 'pending',  client: clientName(0), ids: [idOf('pending', 'HDFCBANK'), idOf('pending', 'SBIN')], daysAgo: 0.4,
        notes: 'Quarterly coverage note on HDFC Bank and State Bank of India. Both insights use the latest reported figures; please review before release.' },
      { status: 'pending',  client: clientName(1), ids: [idOf('pending', 'AXISBANK')], daysAgo: 1.2,
        notes: 'Efficiency snapshot for Axis Bank requested by the client ahead of their investment committee.' },
      { status: 'approved', client: clientName(2), ids: [idOf('approved', 'ICICIBANK'), idOf('approved', 'KOTAKBANK')], daysAgo: 3.5,
        notes: 'Profitability and valuation summaries for ICICI Bank and Kotak Mahindra Bank.', comment: 'Approved. Clear, factual wording.' },
      { status: 'rejected', client: clientName(3), ids: [idOf('rejected', 'SBIN'), idOf('rejected', 'AXISBANK')], daysAgo: 6,
        notes: 'Combined note on SBI and Axis Bank for the annual portfolio review.', comment: 'Returned: add sector averages and remove price-oriented framing, then resubmit.' },
    ];

    for (const r of REPORTS) {
      const createdAt = new Date(Date.now() - r.daysAgo * 86400000);
      const reviewedAt = r.status === 'pending' ? null : new Date(createdAt.getTime() + 5 * 3600000);
      await client.query(
        `INSERT INTO client_reports
           (client_name, analyst_id, analyst_notes, insight_ids, status, cfo_comment, reviewed_by, reviewed_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [r.client, analystId, r.notes, r.ids.join(','), r.status, r.comment ?? null,
         r.status === 'pending' ? null : cfoId, reviewedAt, createdAt],
      );
    }

    // Notifications: CFO for pending reports, analyst for decisions.
    const notes = [
      [cfoId, `New Report: ${clientName(0)}`, `Analyst User submitted a report for ${clientName(0)} awaiting your review.`, false],
      [cfoId, `New Report: ${clientName(1)}`, `Analyst User submitted a report for ${clientName(1)} awaiting your review.`, false],
      [analystId, `Report approved: ${clientName(2)}`, 'CFO User approved your report. Approved. Clear, factual wording.', false],
      [analystId, `Report rejected: ${clientName(3)}`, 'CFO User returned your report: add sector averages and remove price-oriented framing, then resubmit.', false],
    ];
    for (const [uid, title, message, read] of notes) {
      await client.query('INSERT INTO notifications (user_id, title, message, is_read) VALUES ($1,$2,$3,$4)', [uid, title, message, read]);
    }

    await client.query('COMMIT');
    const tally = created.reduce((a, c) => ((a[c.status] = (a[c.status] ?? 0) + 1), a), {});
    console.log('Seeded insights:', tally, '| reports: 2 pending, 1 approved, 1 rejected | notifications: 4');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
