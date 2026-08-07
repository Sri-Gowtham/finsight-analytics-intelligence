import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

router.get('/:ticker', requireAuth, async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const result = await pool.query(
      `SELECT * FROM bank_financials_raw 
       WHERE ticker = $1 
       ORDER BY fetch_date DESC 
       LIMIT 1`,
      [ticker]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for this ticker' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
