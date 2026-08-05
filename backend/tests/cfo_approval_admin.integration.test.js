/**
 * FinSight — CFO Approval Workflow & Admin Extensions Integration Tests
 *
 * Tests covered:
 *   1. GET  /api/clients              — list all clients (any auth'd role)
 *   2. GET  /api/admin/portfolios     — Admin-only portfolio listing
 *   3. GET  /api/insights?status=...  — CFO-only global insight listing by status
 *   4. PATCH /api/insights/:id/approve — CFO-only; 404 for missing insight
 *   5. PATCH /api/insights/:id/reject  — CFO-only; requires rejection_reason; 404 for missing
 *   6. PATCH /api/admin/users/:id     — Admin-only deactivate/reactivate; 404; preserves history
 *
 * Pattern: seed → hit API → verify DB → clean up
 */

import { jest } from '@jest/globals';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('../src/app.js');
const request = supertest(app);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Test-scoped identifiers ──────────────────────────────────────────────────
const RUN_ID        = Date.now();
const ADMIN_EMAIL   = `admin_cfo_${RUN_ID}@finsight.test`;
const CFO_EMAIL     = `cfo_cfo_${RUN_ID}@finsight.test`;
const ANALYST_EMAIL = `analyst_cfo_${RUN_ID}@finsight.test`;
const CLIENT_NAME   = `CFOTestClient_${RUN_ID}`;

let adminToken   = '';
let cfoToken     = '';
let analystToken = '';
let adminId      = 0;
let cfoId        = 0;
let analystId    = 0;
let companyId    = 0;
let insightId1   = 0;   // will be approved in tests
let insightId2   = 0;   // will be rejected in tests
let portfolioId  = 0;

// ── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  // 1. Insert users
  const adminRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Admin', $1, $2, 'Admin') RETURNING user_id`,
    [ADMIN_EMAIL, hash],
  );
  adminId = adminRes.rows[0].user_id;

  const cfoRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test CFO', $1, $2, 'CFO') RETURNING user_id`,
    [CFO_EMAIL, hash],
  );
  cfoId = cfoRes.rows[0].user_id;

  const analystRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Test Analyst', $1, $2, 'Analyst') RETURNING user_id`,
    [ANALYST_EMAIL, hash],
  );
  analystId = analystRes.rows[0].user_id;

  // 2. Get tokens
  const login = async (email) => {
    const res = await request.post('/api/auth/login').send({ email, password: 'Password123!' });
    return res.body.token;
  };
  adminToken   = await login(ADMIN_EMAIL);
  cfoToken     = await login(CFO_EMAIL);
  analystToken = await login(ANALYST_EMAIL);

  // 3. Insert dummy company
  const compRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, 'Banking', 'BSE') RETURNING company_id`,
    [`CFOBank_${RUN_ID}`, `CB_${RUN_ID}`],
  );
  companyId = compRes.rows[0].company_id;

  // 4. Insert two insights (both start as 'pending')
  const ins1 = await pool.query(
    `INSERT INTO insights (company_id, generated_text, source_metric_ids, created_at)
     VALUES ($1, 'NIM improved sharply.', '1,2', NOW()) RETURNING insight_id`,
    [companyId],
  );
  insightId1 = ins1.rows[0].insight_id;

  const ins2 = await pool.query(
    `INSERT INTO insights (company_id, generated_text, source_metric_ids, created_at)
     VALUES ($1, 'NPL ratio is worrying.', '3', NOW()) RETURNING insight_id`,
    [companyId],
  );
  insightId2 = ins2.rows[0].insight_id;

  // 5. Insert a client portfolio entry for the list/portfolio tests
  const portRes = await pool.query(
    `INSERT INTO client_portfolios (client_name, company_id, uploaded_by)
     VALUES ($1, $2, $3) RETURNING id`,
    [CLIENT_NAME, companyId, adminId],
  );
  portfolioId = portRes.rows[0].id;
}, 30_000);

afterAll(async () => {
  await pool.query('DELETE FROM client_portfolios WHERE id = $1', [portfolioId]);
  await pool.query('DELETE FROM insights WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM companies WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM users WHERE user_id = ANY($1::int[])', [[adminId, cfoId, analystId]]);
  await pool.end();
}, 15_000);

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/clients
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clients', () => {
  it('should require authentication', async () => {
    const res = await request.get('/api/clients');
    expect(res.status).toBe(401);
  });

  it('should return list of clients for any authenticated role', async () => {
    // Analyst
    const resA = await request
      .get('/api/clients')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(resA.status).toBe(200);
    expect(Array.isArray(resA.body.clients)).toBe(true);

    const client = resA.body.clients.find((c) => c.client_name === CLIENT_NAME);
    expect(client).toBeDefined();
    expect(Array.isArray(client.companies)).toBe(true);
    expect(client.companies.length).toBeGreaterThan(0);
    expect(client.companies[0]).toHaveProperty('company_id');
    expect(client.companies[0]).toHaveProperty('company_name');
    expect(client.companies[0]).toHaveProperty('ticker');
  });

  it('should also work for CFO and Admin tokens', async () => {
    const resC = await request.get('/api/clients').set('Authorization', `Bearer ${cfoToken}`);
    expect(resC.status).toBe(200);

    const resAdm = await request.get('/api/clients').set('Authorization', `Bearer ${adminToken}`);
    expect(resAdm.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/admin/portfolios
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/portfolios', () => {
  it('should forbid Analyst from listing portfolios', async () => {
    const res = await request
      .get('/api/admin/portfolios')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });

  it('should forbid CFO from listing portfolios', async () => {
    const res = await request
      .get('/api/admin/portfolios')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(403);
  });

  it('should return all portfolio entries for Admin', async () => {
    const res = await request
      .get('/api/admin/portfolios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.portfolios)).toBe(true);

    const entry = res.body.portfolios.find((p) => p.id === portfolioId);
    expect(entry).toBeDefined();
    expect(entry.client_name).toBe(CLIENT_NAME);
    expect(entry.company_id).toBe(companyId);
    expect(entry).toHaveProperty('company_name');
    expect(entry).toHaveProperty('ticker');
    expect(entry).toHaveProperty('uploaded_by');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/insights?status=pending
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/insights', () => {
  it('should require authentication', async () => {
    const res = await request.get('/api/insights');
    expect(res.status).toBe(401);
  });

  it('should forbid Analyst', async () => {
    const res = await request
      .get('/api/insights')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });

  it('should forbid Admin', async () => {
    const res = await request
      .get('/api/insights')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should return pending insights for CFO', async () => {
    const res = await request
      .get('/api/insights?status=pending')
      .set('Authorization', `Bearer ${cfoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(Array.isArray(res.body.insights)).toBe(true);

    const ins = res.body.insights.find((i) => i.insight_id === insightId1);
    expect(ins).toBeDefined();
    expect(ins.approval_status).toBe('pending');
    expect(ins).toHaveProperty('company_name');
    expect(ins).toHaveProperty('ticker');
    // Must not leak source_metric_ids to CFO
    expect(ins).not.toHaveProperty('source_metric_ids');
  });

  it('should return 400 for an invalid status value', async () => {
    const res = await request
      .get('/api/insights?status=bananas')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status must be one of/i);
  });

  it('should default to pending when no status query param given', async () => {
    const res = await request
      .get('/api/insights')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PATCH /api/insights/:id/approve
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/insights/:id/approve', () => {
  it('should forbid Analyst from approving', async () => {
    const res = await request
      .patch(`/api/insights/${insightId1}/approve`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });

  it('should forbid Admin from approving', async () => {
    const res = await request
      .patch(`/api/insights/${insightId1}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should return 404 for a non-existent insight', async () => {
    const res = await request
      .patch('/api/insights/999999999/approve')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/insight not found/i);
  });

  it('should approve the insight and persist to DB', async () => {
    const res = await request
      .patch(`/api/insights/${insightId1}/approve`)
      .set('Authorization', `Bearer ${cfoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.insight.approval_status).toBe('approved');
    expect(res.body.insight.reviewed_by).toBe(cfoId);
    expect(res.body.insight.approved_at).toBeTruthy();

    // Verify in DB
    const dbRes = await pool.query(
      'SELECT approval_status, approved_at, reviewed_by, rejected_at FROM insights WHERE insight_id = $1',
      [insightId1],
    );
    const row = dbRes.rows[0];
    expect(row.approval_status).toBe('approved');
    expect(row.approved_at).toBeTruthy();
    expect(Number(row.reviewed_by)).toBe(cfoId);
    expect(row.rejected_at).toBeNull();
  });

  it('should not appear in pending list after approval', async () => {
    const res = await request
      .get('/api/insights?status=pending')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(200);

    const found = res.body.insights.find((i) => i.insight_id === insightId1);
    expect(found).toBeUndefined();
  });

  it('should appear in approved list', async () => {
    const res = await request
      .get('/api/insights?status=approved')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(res.status).toBe(200);

    const found = res.body.insights.find((i) => i.insight_id === insightId1);
    expect(found).toBeDefined();
    expect(found.approval_status).toBe('approved');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PATCH /api/insights/:id/reject
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/insights/:id/reject', () => {
  it('should forbid Analyst from rejecting', async () => {
    const res = await request
      .patch(`/api/insights/${insightId2}/reject`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ rejection_reason: 'bad data' });
    expect(res.status).toBe(403);
  });

  it('should forbid Admin from rejecting', async () => {
    const res = await request
      .patch(`/api/insights/${insightId2}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejection_reason: 'bad data' });
    expect(res.status).toBe(403);
  });

  it('should return 404 for a non-existent insight', async () => {
    const res = await request
      .patch('/api/insights/999999999/reject')
      .set('Authorization', `Bearer ${cfoToken}`)
      .send({ rejection_reason: 'does not matter' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/insight not found/i);
  });

  it('should return 400 when rejection_reason is missing', async () => {
    const res = await request
      .patch(`/api/insights/${insightId2}/reject`)
      .set('Authorization', `Bearer ${cfoToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rejection_reason is required/i);
  });

  it('should return 400 when rejection_reason is blank', async () => {
    const res = await request
      .patch(`/api/insights/${insightId2}/reject`)
      .set('Authorization', `Bearer ${cfoToken}`)
      .send({ rejection_reason: '   ' });
    expect(res.status).toBe(400);
  });

  it('should reject the insight and persist all fields to DB', async () => {
    const REASON = 'Data source is unreliable for this period.';

    const res = await request
      .patch(`/api/insights/${insightId2}/reject`)
      .set('Authorization', `Bearer ${cfoToken}`)
      .send({ rejection_reason: REASON });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.insight.approval_status).toBe('rejected');
    expect(res.body.insight.rejection_reason).toBe(REASON);
    expect(res.body.insight.reviewed_by).toBe(cfoId);

    // Verify in DB
    const dbRes = await pool.query(
      `SELECT approval_status, rejected_at, reviewed_by, rejection_reason, approved_at
       FROM insights WHERE insight_id = $1`,
      [insightId2],
    );
    const row = dbRes.rows[0];
    expect(row.approval_status).toBe('rejected');
    expect(row.rejected_at).toBeTruthy();
    expect(Number(row.reviewed_by)).toBe(cfoId);
    expect(row.rejection_reason).toBe(REASON);
    expect(row.approved_at).toBeNull();
  });

  it('should appear in rejected list and not in pending', async () => {
    const resPending = await request
      .get('/api/insights?status=pending')
      .set('Authorization', `Bearer ${cfoToken}`);
    expect(resPending.body.insights.find((i) => i.insight_id === insightId2)).toBeUndefined();

    const resRejected = await request
      .get('/api/insights?status=rejected')
      .set('Authorization', `Bearer ${cfoToken}`);
    const found = resRejected.body.insights.find((i) => i.insight_id === insightId2);
    expect(found).toBeDefined();
    expect(found.rejection_reason).toBe('Data source is unreliable for this period.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PATCH /api/admin/users/:id (deactivate / reactivate)
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/users/:id', () => {
  it('should forbid Analyst from toggling user status', async () => {
    const res = await request
      .patch(`/api/admin/users/${analystId}`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
  });

  it('should forbid CFO from toggling user status', async () => {
    const res = await request
      .patch(`/api/admin/users/${cfoId}`)
      .set('Authorization', `Bearer ${cfoToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(403);
  });

  it('should return 400 if is_active is not a boolean', async () => {
    const res = await request
      .patch(`/api/admin/users/${analystId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must be a boolean/i);
  });

  it('should return 404 for a non-existent user', async () => {
    const res = await request
      .patch('/api/admin/users/999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/user not found/i);
  });

  it('should deactivate the analyst user and persist to DB', async () => {
    const res = await request
      .patch(`/api/admin/users/${analystId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.is_active).toBe(false);
    expect(res.body.user.user_id).toBe(analystId);

    // Verify in DB
    const dbRes = await pool.query('SELECT is_active FROM users WHERE user_id = $1', [analystId]);
    expect(dbRes.rows[0].is_active).toBe(false);
  });

  it('deactivated user should still appear in listUsers (soft delete — no purge)', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const user = res.body.users.find((u) => u.user_id === analystId);
    expect(user).toBeDefined();
    expect(user.is_active).toBe(false);
  });

  it('the deactivated analyst\u2019s existing insight reviews remain intact in DB', async () => {
    // insightId1 was reviewed by cfoId (not analystId), but let\u2019s verify the
    // analystId deactivation did NOT cascade-delete or nullify the reviewed_by
    // on insightId1 (which references cfoId, a still-active user).
    const dbRes = await pool.query(
      'SELECT reviewed_by, approval_status FROM insights WHERE insight_id = $1',
      [insightId1],
    );
    expect(dbRes.rows[0].approval_status).toBe('approved');
    expect(Number(dbRes.rows[0].reviewed_by)).toBe(cfoId);
  });

  it('should reactivate the analyst user', async () => {
    const res = await request
      .patch(`/api/admin/users/${analystId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: true });

    expect(res.status).toBe(200);
    expect(res.body.user.is_active).toBe(true);

    // Verify in DB
    const dbRes = await pool.query('SELECT is_active FROM users WHERE user_id = $1', [analystId]);
    expect(dbRes.rows[0].is_active).toBe(true);
  });
});
