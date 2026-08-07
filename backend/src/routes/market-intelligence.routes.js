import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { pool } from '../config/db.js';

const router = Router();

/**
 * GET /api/market-intelligence/:ticker
 * Returns real market data from bank_financials_raw.
 * COMPLIANCE: investment_summary and recommendation fields are
 * stripped server-side — FinSight never exposes buy/sell/hold.
 */
router.get('/:ticker', requireAuth, requireRole('Analyst', 'CFO', 'Admin'), async (req, res, next) => {
  try {
    const { ticker } = req.params;

    const result = await pool.query(
      `SELECT
         ticker,
         fetch_date,
         source,
         market_data,
         company_profile,
         income_statement,
         annual_results,
         cash_flow,
         fetched_at
       FROM bank_financials_raw
       WHERE UPPER(ticker) = UPPER($1)
         AND source = 'indianapi.in'
       ORDER BY fetch_date DESC
       LIMIT 1`,
      [ticker]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No market data found for this ticker' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market-intelligence
 * Returns latest market snapshot for all banks.
 * COMPLIANCE: no investment recommendations exposed.
 */
router.get('/', requireAuth, requireRole('Analyst', 'CFO', 'Admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (ticker)
         ticker,
         fetch_date,
         source,
         market_data,
         company_profile,
         fetched_at
       FROM bank_financials_raw
       WHERE source = 'indianapi.in'
       ORDER BY ticker, fetch_date DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market-intelligence/sector/analysis
 * Returns the latest SNS agent sector analysis.
 * COMPLIANCE: strips investment_summary entirely before sending.
 */
router.get('/sector/analysis', requireAuth, requireRole('Analyst', 'CFO', 'Admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, created_at, generated_text, insight_type
       FROM insights
       WHERE insight_type = 'sector_analysis'
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No sector analysis available yet' });
    }

    let analysis = result.rows[0];
    
    // Parse if stored as string
    if (typeof analysis.generated_text === 'string') {
      try {
        const parsed = JSON.parse(analysis.generated_text);
        // COMPLIANCE: strip buy/sell/hold recommendations
        delete parsed.investment_summary;
        analysis = { ...analysis, generated_text: parsed };
      } catch {
        // Not JSON — return as plain text
      }
    }

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
