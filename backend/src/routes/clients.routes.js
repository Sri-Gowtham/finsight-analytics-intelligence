import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  listClients,
  createClient,
  updateClient,
  uploadClientFile,
  listClientFiles,
  getClientPortfolio
} from '../controllers/clients.controller.js';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientId = req.params.id;
    const dir = path.join(process.cwd(), 'uploads', 'clients', clientId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Secure all client endpoints
router.use(requireAuth);

router.get('/list', async (req, res, next) => {
  try {
    const { pool } = await import('../config/db.js');
    const { rows } = await pool.query(
      `SELECT c.*, u.name as analyst_name
       FROM clients c
       LEFT JOIN users u ON u.user_id = c.assigned_analyst_id
       ORDER BY c.created_at DESC`
    );
    return res.json({ clients: rows });
  } catch (err) { next(err); }
});

router.get('/', listClients);
router.post('/', createClient);
router.patch('/:id', updateClient);
router.post('/:id/files', upload.single('file'), uploadClientFile);
router.get('/:id/files', listClientFiles);
router.get('/:clientName/portfolio', getClientPortfolio);

export default router;
