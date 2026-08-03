import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { createUser, listUsers } from '../controllers/admin.controller.js';

const router = Router();

// Every route in this file requires Admin role
router.use(requireAuth, requireRole('Admin'));

router.post('/users', createUser);
router.get('/users',  listUsers);

export default router;
