import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '8h';

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user: { user_id, name, email, role } }
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT user_id, name, email, role, password_hash FROM users WHERE email = $1',
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
