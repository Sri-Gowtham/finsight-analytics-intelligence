import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

/**
 * GET /api/portfolios
 * Returns all client_portfolios — accessible by Analyst, CFO, Admin.
 * This is a non-admin endpoint intentionally so Analysts can see all portfolios.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
         cp.id,
         cp.client_name,
         cp.company_id,
         cp.uploaded_by,
         cp.analyst_id,
         cp.client_details,
         c.ticker,
         c.name as bank_name,
         u.name as analyst_name
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       LEFT JOIN users u ON u.user_id = cp.analyst_id
       ORDER BY cp.client_name, c.name`
    );
    return res.json({ portfolios: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
