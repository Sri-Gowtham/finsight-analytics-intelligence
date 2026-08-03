import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 12;
const VALID_ROLES = ['Analyst', 'CFO', 'Admin'];

/**
 * POST /api/admin/users
 * Body: { name, email, password, role }
 * Creates a new user. Admin-only.
 */
export async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    // Check for duplicate email
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role`,
      [name, email, password_hash, role],
    );

    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 * Returns all users (without password_hash). Admin-only.
 */
export async function listUsers(_req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, name, email, role FROM users ORDER BY user_id',
    );
    return res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}
