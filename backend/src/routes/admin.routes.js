import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createUser,
  listUsers,
  deactivateUser,
  listPortfolios,
  uploadPortfolio,
  updatePortfolio,
  deletePortfolio,
} from '../controllers/admin.controller.js';

const router = Router();

// Every route in this file requires Admin role
router.use(requireAuth, requireRole('Admin'));

// User management
router.post('/users',          createUser);
router.get('/users',           listUsers);
router.patch('/users/:id',     deactivateUser);

// Portfolio management routes
router.get('/portfolios',       listPortfolios);
router.post('/portfolios',      uploadPortfolio);
router.put('/portfolios/:id',   updatePortfolio);
router.delete('/portfolios/:id', deletePortfolio);

export default router;
