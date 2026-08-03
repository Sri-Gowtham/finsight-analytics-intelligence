import { pool } from '../config/db.js';

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

    // Fetch current value (latest timestamp)
    const metricRes = await pool.query(
      `SELECT value 
       FROM financial_metrics 
       WHERE company_id = $1 AND metric_name = $2 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [company_id, metric_name]
    );

    if (metricRes.rows.length === 0) {
      return res.status(400).json({ error: 'No current metric data found for company' });
    }
    const current_value = Number(metricRes.rows[0].value);

    // Fetch sector average
    const sectorAvgRes = await pool.query(
      `SELECT AVG(value) as sector_avg
       FROM financial_metrics fm
       JOIN companies c ON c.company_id = fm.company_id
       WHERE c.sector = 'Banking' AND fm.metric_name = $1
       AND fm.timestamp = (
         SELECT MAX(timestamp) 
         FROM financial_metrics 
         WHERE company_id = fm.company_id AND metric_name = fm.metric_name
       )`,
      [metric_name]
    );
    // Actually the prompt just says: "Fetch the sector average for that metric across all banks with sector = 'Banking'". 
    // Simplified sector average:
    const simpleAvgRes = await pool.query(
      `SELECT AVG(fm.value) as sector_avg
       FROM (
         SELECT DISTINCT ON (company_id) company_id, value
         FROM financial_metrics
         WHERE metric_name = $1
         ORDER BY company_id, timestamp DESC
       ) fm
       JOIN companies c ON c.company_id = fm.company_id
       WHERE c.sector = 'Banking'`,
       [metric_name]
    );
    const sector_avg = simpleAvgRes.rows[0]?.sector_avg || 0;

    const delta = hypothetical_value - current_value;
    const percent_change = (delta / current_value) * 100;

    // Call OpenAI
    let generated_text = "";
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      generated_text = data.choices[0].message.content;
      
      const disclaimer = 'This is a scenario estimate, not a prediction or guarantee.';
      if (!generated_text.toLowerCase().includes(disclaimer.toLowerCase())) {
        generated_text = `${generated_text} ${disclaimer}`;
      }
    } catch (apiErr) {
      console.error(apiErr);
      return res.status(500).json({ error: 'Failed to generate insight from OpenAI' });
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
