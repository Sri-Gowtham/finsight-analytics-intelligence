import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getClientPortfolio } from '../controllers/clients.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/:clientName/portfolio', getClientPortfolio);

export default router;
