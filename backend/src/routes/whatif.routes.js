import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { createScenario, getHistory } from '../controllers/whatif.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('Analyst'), createScenario);
router.get('/history/:analystId', getHistory);

export default router;
