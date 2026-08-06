import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import nodemailer from 'nodemailer';

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
      [name, email, password_hash, role]
    );

    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/users/invite
 * Body: { name, email, password, role }
 * Creates a new user and sends an invite email. Admin-only.
 */
export async function inviteUser(req, res, next) {
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
      [name, email, password_hash, role]
    );

    // Send welcome email
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
          from: `"FinSight Admin" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Your FinSight Access Has Been Created",
          text: `Hello ${name},

Your FinSight account has been created.
Login URL: http://localhost:8081/login
Email: ${email}
Temporary Password: ${password}

Please change your password after first login.

— FinSight Admin`,
        });
        console.log(`[ADMIN] Sent invite email to ${email}`);
      } catch (mailErr) {
        console.error("Nodemailer delivery failed:", mailErr.message);
      }
    } else {
        console.log(`[ADMIN] SMTP not configured. Invite email for ${email} skipped.`);
    }

    return res.status(201).json({ success: true, user: rows[0] });
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
      'SELECT user_id, name, email, role, is_active FROM users ORDER BY user_id'
    );
    return res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id
 * Body: { is_active: boolean }
 * Toggles a user's active status. No hard delete — preserves audit history.
 * Admin-only.
 */
export async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Verify user exists
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { rows } = await pool.query(
      `UPDATE users SET is_active = $1 WHERE user_id = $2
       RETURNING user_id, name, email, role, is_active`,
      [is_active, id]
    );

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/portfolios
 * Returns all client_portfolio rows joined with company name. Admin-only.
 */
export async function listPortfolios(_req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         cp.id,
         cp.client_name,
         cp.company_id,
         c.name   AS company_name,
         c.ticker,
         cp.uploaded_by
       FROM client_portfolios cp
       JOIN companies c ON c.company_id = cp.company_id
       ORDER BY cp.client_name, c.name`
    );
    return res.json({ portfolios: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/portfolios
 * Body: { client_name, bank_tickers: ["HDFCBANK", "ICICIBANK"] }
 * Upload structured client portfolio data. Admin-only.
 */
export async function uploadPortfolio(req, res, next) {
  try {
    const { client_name, bank_tickers } = req.body;
    
    if (!client_name || !Array.isArray(bank_tickers)) {
      return res.status(400).json({ error: 'client_name and bank_tickers array are required' });
    }

    const failed_tickers = [];
    let inserted_count = 0;
    let skipped_duplicates = 0;

    for (const ticker of bank_tickers) {
      // Find company by ticker
      const companyRes = await pool.query('SELECT company_id FROM companies WHERE ticker = $1', [ticker]);
      
      if (companyRes.rows.length === 0) {
        failed_tickers.push(ticker);
        continue;
      }
      
      const company_id = companyRes.rows[0].company_id;

      // Check for duplicate
      const duplicateRes = await pool.query(
        'SELECT 1 FROM client_portfolios WHERE client_name = $1 AND company_id = $2',
        [client_name, company_id]
      );

      if (duplicateRes.rows.length > 0) {
        skipped_duplicates++;
        continue;
      }

      // Insert new entry
      await pool.query(
        'INSERT INTO client_portfolios (client_name, company_id, uploaded_by) VALUES ($1, $2, $3)',
        [client_name, company_id, req.user.user_id]
      );
      inserted_count++;
    }

    return res.json({
      success: true,
      client_name,
      inserted_count,
      skipped_duplicates,
      failed_tickers,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/portfolios/:id
 * Body: { company_id }
 * Update which company_id a specific portfolio row points to. Admin-only.
 */
export async function updatePortfolio(req, res, next) {
  try {
    const { id } = req.params;
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    // Verify portfolio entry exists
    const existing = await pool.query('SELECT id FROM client_portfolios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio entry not found' });
    }

    // FIX 1 — Validate company_id before updating a portfolio
    const companyExists = await pool.query(
      'SELECT company_id FROM companies WHERE company_id = $1',
      [company_id]
    );
    if (companyExists.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await pool.query(
      'UPDATE client_portfolios SET company_id = $1 WHERE id = $2',
      [company_id, id]
    );

    return res.json({ success: true, message: 'Portfolio entry updated successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/portfolios/:id
 * Removes a specific portfolio entry. Admin-only.
 */
export async function deletePortfolio(req, res, next) {
  try {
    const { id } = req.params;

    // Verify portfolio entry exists
    const existing = await pool.query('SELECT id FROM client_portfolios WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio entry not found' });
    }

    await pool.query('DELETE FROM client_portfolios WHERE id = $1', [id]);

    // FIX 2 — Improve DELETE response
    return res.json({
      success: true,
      deleted_id: Number(id),
      message: 'Portfolio entry deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}
