import { pool } from '../config/db.js';

/**
 * GET /api/clients/:clientId/portfolio
 * Returns the banks a specific client holds (from client_portfolios),
 * joined with each bank's latest metrics.
 */
export async function getClientPortfolio(req, res, next) {
  try {
    const { clientId } = req.params;

    const { rows } = await pool.query(
      `SELECT
         cp.company_id,
         c.name        AS company_name,
         c.sector,
         fm.metrics
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       LEFT JOIN LATERAL (
         SELECT json_agg(sub) AS metrics
         FROM (
           SELECT DISTINCT ON (metric_name)
                  metric_name, value, timestamp
           FROM   financial_metrics
           WHERE  company_id = cp.company_id
           ORDER  BY metric_name, timestamp DESC
         ) sub
       ) fm ON true
       WHERE cp.client_id = $1
       ORDER BY c.name`,
      [clientId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No portfolio found for this client' });
    }

    return res.json({ client_id: Number(clientId), portfolio: rows });
  } catch (err) {
    next(err);
  }
}
