import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listCompanies,
  getLatestMetrics,
  getMetricsHistory,
  getInsights,
} from '../controllers/companies.controller.js';

const router = Router();

// All company routes require authentication
router.use(requireAuth);

router.get('/',                   listCompanies);
router.get('/:id/metrics',        getLatestMetrics);
router.get('/:id/metrics/history', getMetricsHistory);
router.get('/:id/insights',       getInsights);

export default router;
