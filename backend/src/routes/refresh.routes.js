import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { refreshAllBanks } from '../agent/index.js';

const router = Router();

// Cron/service callers send x-refresh-token; people use an Admin JWT.
function tokenOrAdmin(req, res, next) {
  const expected = process.env.REFRESH_TOKEN;
  if (expected && req.get('x-refresh-token') === expected) return next();
  return requireAuth(req, res, (err) => (err ? next(err) : requireRole('Admin')(req, res, next)));
}

/**
 * POST /api/refresh-data
 * Starts a live data refresh in the background and returns immediately
 * (a full run takes ~20-60s, longer than a typical request timeout).
 */
router.post('/', tokenOrAdmin, (_req, res) => {
  refreshAllBanks().catch((err) => console.error('Refresh failed:', err.message));
  res.status(202).json({ status: 'started' });
});

export default router;
