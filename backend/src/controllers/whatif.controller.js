import { pool } from '../config/db.js';
import Groq from 'groq-sdk';

const ALLOWED_METRICS = ['NIM', 'NPA_percent', 'CAR', 'loan_growth'];

/**
 * POST /api/whatif
 * Request body: { company_id, metric_name, hypothetical_value }
 */
export async function createScenario(req, res, next) {
  try {
    const { company_id, metric_name, hypothetical_value } = req.body;
    const analyst_id = req.user.user_id;

    if (!ALLOWED_METRICS.includes(metric_name)) {
      return res.status(400).json({ error: 'Invalid metric_name' });
    }

    if (!company_id || hypothetical_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate company exists
    const companyRes = await pool.query('SELECT * FROM companies WHERE company_id = $1', [company_id]);
    if (companyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Fetch current value from bank_financials_raw
    const metricRes = await pool.query(
      `SELECT market_data
       FROM bank_financials_raw
       WHERE company_id = $1
       ORDER BY fetch_date DESC
       LIMIT 1`,
      [company_id]
    );

    if (metricRes.rows.length === 0) {
      return res.status(400).json({ error: 'No current metric data found for company' });
    }

    // Extract metric value from market_data JSON
    const marketData = typeof metricRes.rows[0].market_data === 'string'
      ? JSON.parse(metricRes.rows[0].market_data)
      : metricRes.rows[0].market_data;

    let current_value = 0;
    if (metric_name === 'NIM') {
      current_value = marketData.nim ?? 0;
    } else if (metric_name === 'NPA_percent') {
      current_value = marketData.gnpa ?? 0;
    } else if (metric_name === 'CAR') {
      current_value = marketData.car ?? 0;
    } else if (metric_name === 'loan_growth') {
      current_value = marketData.loan_growth ?? 0;
    }

    // Fetch sector average from bank_financials_raw
    const sectorRes = await pool.query(
      `SELECT DISTINCT ON (bfr.company_id) bfr.market_data, c.ticker
       FROM bank_financials_raw bfr
       JOIN companies c ON c.company_id = bfr.company_id
       WHERE c.sector = 'Banking'
       ORDER BY bfr.company_id, bfr.fetch_date DESC`
    );

    let sector_avg = 0;
    if (sectorRes.rows.length > 0) {
      const values = [];

      for (const row of sectorRes.rows) {
        const mktData = typeof row.market_data === 'string'
          ? JSON.parse(row.market_data)
          : row.market_data;

        let val = 0;
        if (metric_name === 'NIM') val = mktData.nim ?? 0;
        else if (metric_name === 'NPA_percent') val = mktData.gnpa ?? 0;
        else if (metric_name === 'CAR') val = mktData.car ?? 0;
        else if (metric_name === 'loan_growth') val = mktData.loan_growth ?? 0;

        if (val > 0) values.push(val);
      }

      sector_avg = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
    }

    const delta = hypothetical_value - current_value;
    const percent_change = (delta / current_value) * 100;

    // Call Groq
    let generated_text = "";
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: "You are a financial scenario narrator. You NEVER predict the future and NEVER give investment advice. You only describe the estimated directional impact of a hypothetical input, in 2 short sentences, plain language. You MUST include the exact disclaimer: 'This is a scenario estimate, not a prediction or guarantee.'"
          },
          {
            role: 'user',
            content: `Metric: ${metric_name}. Current value: ${current_value}. Hypothetical value: ${hypothetical_value}. Delta: ${delta}. Percent change: ${percent_change}%. Sector average: ${sector_avg}. Describe the impact.`
          }
        ]
      });

      generated_text = completion.choices[0].message.content;
      
      const disclaimer = 'This is a scenario estimate, not a prediction or guarantee.';
      if (!generated_text.toLowerCase().includes(disclaimer.toLowerCase())) {
        generated_text = `${generated_text} ${disclaimer}`;
      }
    } catch (apiErr) {
      console.error(apiErr);
      return res.status(500).json({ error: 'Failed to generate insight from Groq' });
    }

    // Save to whatif_scenarios
    const insertRes = await pool.query(
      `INSERT INTO whatif_scenarios (company_id, analyst_id, metric_name, current_value, hypothetical_value, estimated_output, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING scenario_id`,
      [company_id, analyst_id, metric_name, current_value, hypothetical_value, generated_text]
    );

    return res.json({ 
      success: true, 
      scenario_id: insertRes.rows[0].scenario_id, 
      insight: generated_text 
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/whatif/history/:analystId
 */
export async function getHistory(req, res, next) {
  try {
    const { analystId } = req.params;

    // Ownership check
    if (req.user.role !== 'Admin' && String(req.user.user_id) !== String(analystId)) {
      return res.status(403).json({ error: 'Forbidden: Cannot view another analyst\'s history' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM whatif_scenarios 
       WHERE analyst_id = $1 
       ORDER BY created_at DESC`,
      [analystId]
    );

    return res.json({ history: rows });
  } catch (err) {
    next(err);
  }
}
