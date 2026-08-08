import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

// Helper: create notification
async function notify(userId, title, message) {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message)
     VALUES ($1, $2, $3)`,
    [userId, title, message]
  );
}

/**
 * POST /api/reports
 * Analyst submits a report for CFO review
 */
router.post('/', requireAuth, requireRole('Analyst'), async (req, res, next) => {
  try {
    const { client_name, analyst_notes, insight_ids } = req.body;
    const analyst_id = req.user.user_id;

    if (!client_name || !analyst_notes || !insight_ids?.length) {
      return res.status(400).json({ 
        error: 'client_name, analyst_notes and insight_ids are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO client_reports 
         (client_name, analyst_id, analyst_notes, insight_ids)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [client_name, analyst_id, analyst_notes, 
       Array.isArray(insight_ids) ? insight_ids.join(',') : insight_ids]
    );

    const analystRow = await pool.query(
      `SELECT name FROM users WHERE user_id = $1`,
      [analyst_id]
    );
    const analystName = analystRow.rows[0]?.name ?? 'An analyst';

    // Notify all CFO users about the new report
    const cfos = await pool.query(
      `SELECT user_id FROM users WHERE role = 'CFO'`
    );
    for (const cfo of cfos.rows) {
      await notify(
        cfo.user_id,
        `New Report: ${client_name}`,
        `${analystName} submitted a report for ${client_name} awaiting your review.`
      );
    }

    return res.status(201).json({ 
      success: true, 
      report: result.rows[0] 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports
 * CFO sees all reports | Analyst sees own reports
 */
router.get('/', requireAuth, requireRole('Analyst', 'CFO', 'Admin'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const isCFO = req.user.role === 'CFO' || req.user.role === 'Admin';

    let query = `
      SELECT 
        cr.*,
        u.name as analyst_name,
        u.email as analyst_email,
        reviewer.name as reviewer_name
      FROM client_reports cr
      JOIN users u ON u.user_id = cr.analyst_id
      LEFT JOIN users reviewer ON reviewer.user_id = cr.reviewed_by
      WHERE 1=1
    `;
    const params = [];

    if (!isCFO) {
      params.push(req.user.user_id);
      query += ` AND cr.analyst_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND cr.status = $${params.length}`;
    }

    query += ` ORDER BY cr.created_at DESC`;

    const result = await pool.query(query, params);
    return res.json({ success: true, reports: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/:id
 * Get single report with insights
 */
router.get('/:id', requireAuth, requireRole('Analyst', 'CFO', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT cr.*,
        u.name as analyst_name,
        reviewer.name as reviewer_name
       FROM client_reports cr
       JOIN users u ON u.user_id = cr.analyst_id
       LEFT JOIN users reviewer ON reviewer.user_id = cr.reviewed_by
       WHERE cr.report_id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Ownership check for analysts
    if (req.user.role === 'Analyst' && 
        report.analyst_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch attached insights
    const insightIds = report.insight_ids
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(Boolean);

    let insights = [];
    if (insightIds.length) {
      const ins = await pool.query(
        `SELECT insight_id, company_id, generated_text, 
                insight_type, created_at
         FROM insights
         WHERE insight_id = ANY($1::int[])`,
        [insightIds]
      );
      insights = ins.rows;
    }

    return res.json({ success: true, report, insights });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/reports/:id/review
 * CFO approves or rejects a report
 */
router.patch('/:id/review', requireAuth, requireRole('CFO', 'Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cfo_comment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'status must be approved or rejected' 
      });
    }

    const result = await pool.query(
      `UPDATE client_reports
       SET status = $1,
           cfo_comment = $2,
           reviewed_by = $3,
           reviewed_at = NOW()
       WHERE report_id = $4
       RETURNING *`,
      [status, cfo_comment ?? null, req.user.user_id, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Notify the analyst
    const action = status === 'approved' ? 'approved' : 'rejected';
    const title = `Report ${action}: ${report.client_name}`;
    const message = status === 'approved'
      ? `Your report for ${report.client_name} was approved by the CFO.`
      : `Your report for ${report.client_name} was rejected. CFO comment: ${cfo_comment ?? 'No comment provided.'}`;

    await notify(report.analyst_id, title, message);

    return res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/notifications/mine
 * Get current user's notifications
 */
router.get('/notifications/mine', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );
    const unread = result.rows.filter(n => !n.is_read).length;
    return res.json({ 
      success: true, 
      notifications: result.rows,
      unread_count: unread
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/reports/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE notification_id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
