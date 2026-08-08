import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  listInsightsByStatus,
  approveInsight,
  rejectInsight,
} from '../controllers/insights.controller.js';
import { pool } from '../config/db.js';

const router = Router();

// All insight routes require authentication
router.use(requireAuth);

// GET /api/insights/:id  — CFO/Admin: get single insight
router.get('/:id', requireAuth, requireRole('CFO', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT i.*, c.ticker, c.name as bank_name
       FROM insights i
       JOIN companies c ON c.company_id = i.company_id
       WHERE i.insight_id = $1`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    return res.json({ insight: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/insights?status=pending  — CFO-only: list by approval status
router.get('/', requireRole('CFO'), listInsightsByStatus);

// PATCH /api/insights/:id/approve  — CFO-only
router.patch('/:id/approve', requireRole('CFO'), approveInsight);

// PATCH /api/insights/:id/reject   — CFO-only
router.patch('/:id/reject', requireRole('CFO'), rejectInsight);

export default router;
