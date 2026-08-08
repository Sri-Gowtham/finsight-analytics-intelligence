import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  createUser,
  inviteUser,
  listUsers,
  deactivateUser,
  listPortfolios,
  uploadPortfolio,
  updatePortfolio,
  deletePortfolio,
} from '../controllers/admin.controller.js';
import clientsRoutes from './clients.routes.js';
import { pool } from '../config/db.js';

const router = Router();

// Every route in this file requires Admin role
router.use(requireAuth, requireRole('Admin'));

// User management
router.post('/users',          createUser);
router.post('/users/invite',   inviteUser);
router.get('/users',           listUsers);
router.patch('/users/:id',     deactivateUser);

// Clients management
router.use('/clients', clientsRoutes);

// Portfolio management routes
router.get('/portfolios',       listPortfolios);
router.post('/portfolios',      uploadPortfolio);
router.put('/portfolios/:id',   updatePortfolio);
router.delete('/portfolios/:id', deletePortfolio);

router.put('/portfolios/:id/assign', 
  requireAuth, requireRole('Admin'), 
  async (req, res, next) => {
    try {
      const { analyst_id } = req.body;
      const result = await pool.query(
        `UPDATE client_portfolios
         SET analyst_id = $1
         WHERE id = $2
         RETURNING *`,
        [analyst_id || null, req.params.id]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      return res.json({ success: true, portfolio: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

