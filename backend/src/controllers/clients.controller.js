import { pool } from '../config/db.js';

/**
 * GET /api/clients
 * Returns distinct client names from client_portfolios along with
 * the companies associated with each client.
 * Auth required, any role.
 */
export async function listClients(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         cp.client_name,
         json_agg(
           json_build_object(
             'company_id',   c.company_id,
             'company_name', c.name,
             'ticker',       c.ticker,
             'sector',       c.sector
           ) ORDER BY c.name
         ) AS companies
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       GROUP BY cp.client_name
       ORDER BY cp.client_name`,
    );

    return res.json({ clients: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/clients/:clientName/portfolio
 * Returns the banks a specific client holds (from client_portfolios),
 * joined with each bank's latest metrics.
 */
export async function getClientPortfolio(req, res, next) {
  try {
    const { clientName } = req.params;

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
       WHERE cp.client_name = $1
       ORDER BY c.name`,
      [clientName],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No portfolio found for this client' });
    }

    return res.json({ client_name: clientName, portfolio: rows });
  } catch (err) {
    next(err);
  }
}
