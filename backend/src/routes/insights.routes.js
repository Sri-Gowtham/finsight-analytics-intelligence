import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  listInsightsByStatus,
  approveInsight,
  rejectInsight,
} from '../controllers/insights.controller.js';

const router = Router();

// All insight routes require authentication
router.use(requireAuth);

// GET /api/insights?status=pending  — CFO-only: list by approval status
router.get('/', requireRole('CFO'), listInsightsByStatus);

// PATCH /api/insights/:id/approve  — CFO-only
router.patch('/:id/approve', requireRole('CFO'), approveInsight);

// PATCH /api/insights/:id/reject   — CFO-only
router.patch('/:id/reject', requireRole('CFO'), rejectInsight);

export default router;
