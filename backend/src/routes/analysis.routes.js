import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { whatIfAnalysis } from '../controllers/analysis.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Protect the endpoint so only authenticated Analysts, CFOs, or Admins can request AI analysis.
router.post(
  '/what-if',
  requireAuth,
  requireRole('Analyst', 'CFO', 'Admin'),
  asyncHandler(whatIfAnalysis)
);

export default router;
