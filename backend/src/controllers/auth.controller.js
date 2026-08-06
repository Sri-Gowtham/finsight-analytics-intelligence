import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'Admin' } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role`,
      [name || email.split('@')[0], email, password_hash, role],
    );
    return res.status(201).json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (email, otp, expires_at, used) VALUES ($1, $2, $3, false)',
      [email, otp, expiresAt]
    );

    console.log(`[AUTH] Password reset OTP generated for ${email}: ${otp}`);

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: `"FinSight Security" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Your Password Reset OTP — FinSight",
          text: `Your one-time password (OTP) for resetting your FinSight password is: ${otp}. This code expires in 15 minutes.`,
        });
      } catch (mailErr) {
        console.error("Nodemailer delivery failed:", mailErr.message);
      }
    }

    // Never confirm or deny email existence for security requirements
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp, new_password }
 */
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id FROM password_reset_tokens WHERE email = $1 AND otp = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    const tokenId = rows[0].id;
    const passwordHash = await bcrypt.hash(new_password, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenId]);

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
