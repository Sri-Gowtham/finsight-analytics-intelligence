import { pool } from '../config/db.js';

/**
 * GET /api/health
 * Returns { status: "ok" } when the server is alive.
 * Optionally pings Postgres so deployment platforms can gate readiness.
 */
export async function getHealth(_req, res, next) {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    // Server is up, but DB is unreachable
    return res.status(503).json({ status: 'ok', database: 'disconnected' });
  }
}
