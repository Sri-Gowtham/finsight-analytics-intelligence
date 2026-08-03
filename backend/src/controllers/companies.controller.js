import { pool } from '../config/db.js';

/**
 * GET /api/companies
 * Returns all tracked banks/companies.
 */
export async function listCompanies(_req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM companies ORDER BY company_id',
    );
    return res.json({ companies: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/companies/:id/metrics
 * Returns the latest value for each metric_name for the given company.
 * Uses DISTINCT ON to pick only the most-recent timestamp per metric.
 */
export async function getLatestMetrics(req, res, next) {
  try {
    const { id } = req.params;

    // Verify company exists
    const company = await pool.query(
      'SELECT company_id FROM companies WHERE company_id = $1',
      [id],
    );
    if (company.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT ON (metric_name)
              metric_name, value, timestamp
       FROM   financial_metrics
       WHERE  company_id = $1
       ORDER  BY metric_name, timestamp DESC`,
      [id],
    );

    return res.json({ company_id: Number(id), metrics: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/companies/:id/metrics/history?timestamp=<ISO date>
 * Historical Replay: returns the metric values that were current
 * AS OF the given timestamp.  For each metric_name, finds the row
 * with the largest timestamp <= the supplied timestamp.
 */
export async function getMetricsHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { timestamp } = req.query;

    if (!timestamp) {
      return res.status(400).json({ error: 'Query parameter "timestamp" is required' });
    }

    // Verify company exists
    const company = await pool.query(
      'SELECT company_id FROM companies WHERE company_id = $1',
      [id],
    );
    if (company.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { rows } = await pool.query(
      `SELECT DISTINCT ON (metric_name)
              metric_name, value, timestamp
       FROM   financial_metrics
       WHERE  company_id = $1
         AND  timestamp <= $2
       ORDER  BY metric_name, timestamp DESC`,
      [id, timestamp],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No metric data exists at or before the given timestamp',
      });
    }

    return res.json({ company_id: Number(id), as_of: timestamp, metrics: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/companies/:id/insights
 * Returns all generated insights for the given company, most recent first.
 *
 * Role-based response shaping:
 *   - CFO:              only generated_text and created_at
 *   - Analyst / Admin:  full detail including source_metric_ids
 */
export async function getInsights(req, res, next) {
  try {
    const { id } = req.params;

    // Verify company exists
    const company = await pool.query(
      'SELECT company_id FROM companies WHERE company_id = $1',
      [id],
    );
    if (company.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const { rows } = await pool.query(
      `SELECT insight_id, generated_text, source_metric_ids, created_at
       FROM   insights
       WHERE  company_id = $1
       ORDER  BY created_at DESC`,
      [id],
    );

    // Shape response based on role
    if (req.user.role === 'CFO') {
      const shaped = rows.map(({ generated_text, created_at }) => ({
        generated_text,
        created_at,
      }));
      return res.json({ company_id: Number(id), insights: shaped });
    }

    return res.json({ company_id: Number(id), insights: rows });
  } catch (err) {
    next(err);
  }
}
