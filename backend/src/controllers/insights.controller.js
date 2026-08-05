import { pool } from '../config/db.js';

/**
 * GET /api/insights?status=pending|approved|rejected
 *
 * Returns insights across ALL companies filtered by approval_status.
 * CFO-only. Returns CFO-shaped payload (no source_metric_ids).
 */
export async function listInsightsByStatus(req, res, next) {
  try {
    const status = req.query.status || 'pending';
    const VALID_STATUSES = ['pending', 'approved', 'rejected'];

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const { rows } = await pool.query(
      `SELECT
         i.insight_id,
         i.company_id,
         c.name        AS company_name,
         c.ticker,
         i.generated_text,
         i.approval_status,
         i.approved_at,
         i.rejected_at,
         i.rejection_reason,
         i.reviewed_by,
         i.created_at
       FROM insights i
       JOIN companies c ON c.company_id = i.company_id
       WHERE i.approval_status = $1
       ORDER BY i.created_at DESC`,
      [status],
    );

    return res.json({ status, insights: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/insights/:id/approve
 *
 * Sets approval_status = 'approved', approved_at = NOW(), reviewed_by = caller.
 * CFO-only.
 */
export async function approveInsight(req, res, next) {
  try {
    const { id } = req.params;

    // Verify the insight exists
    const existing = await pool.query(
      'SELECT insight_id FROM insights WHERE insight_id = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const { rows } = await pool.query(
      `UPDATE insights
         SET approval_status = 'approved',
             approved_at     = NOW(),
             reviewed_by     = $1,
             rejected_at     = NULL,
             rejection_reason = NULL
       WHERE insight_id = $2
       RETURNING insight_id, approval_status, approved_at, reviewed_by`,
      [req.user.user_id, id],
    );

    return res.json({ success: true, insight: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/insights/:id/reject
 *
 * Body: { rejection_reason }
 * Sets approval_status = 'rejected', rejected_at = NOW(), reviewed_by, rejection_reason.
 * CFO-only.
 */
export async function rejectInsight(req, res, next) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // rejection_reason is required for audit trail
    if (!rejection_reason || String(rejection_reason).trim() === '') {
      return res.status(400).json({ error: 'rejection_reason is required' });
    }

    // Verify the insight exists
    const existing = await pool.query(
      'SELECT insight_id FROM insights WHERE insight_id = $1',
      [id],
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const { rows } = await pool.query(
      `UPDATE insights
         SET approval_status  = 'rejected',
             rejected_at      = NOW(),
             reviewed_by      = $1,
             rejection_reason = $2,
             approved_at      = NULL
       WHERE insight_id = $3
       RETURNING insight_id, approval_status, rejected_at, reviewed_by, rejection_reason`,
      [req.user.user_id, rejection_reason.trim(), id],
    );

    return res.json({ success: true, insight: rows[0] });
  } catch (err) {
    next(err);
  }
}
