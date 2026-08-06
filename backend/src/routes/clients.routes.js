import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  listClients,
  createClient,
  updateClient,
  uploadClientFile,
  listClientFiles
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

router.get('/', listClients);
router.post('/', createClient);
router.patch('/:id', updateClient);
router.post('/:id/files', upload.single('file'), uploadClientFile);
router.get('/:id/files', listClientFiles);

export default router;
