/**
 * FinSight — Auth & Admin Integration Tests
 *
 * Full lifecycle test against a real PostgreSQL database:
 *   1. Seed a temporary Admin user (direct DB insert)
 *   2. Login as Admin → save JWT
 *   3. Create an Analyst via the Admin API
 *   4. Verify the Analyst appears in the user list
 *   5. Verify duplicate-email handling
 *   6. Verify unauthenticated access is rejected
 *   7. Verify role-based authorization (Analyst cannot access admin routes)
 *   8. Verify password_hash never appears in any response
 *   9. Clean up all test data
 */

import { jest } from '@jest/globals';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ── Bootstrap ───────────────────────────────────────────────────────────────
// Import the Express app (NOT server.js — we don't want to start a listener).
const { default: app } = await import('../src/app.js');

const request = supertest(app);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Test-scoped identifiers (unique per run to avoid collisions) ─────────
const RUN_ID        = Date.now();
const ADMIN_EMAIL   = `test_admin_${RUN_ID}@finsight.test`;
const ADMIN_PASS    = 'Admin$ecure1!';
const ANALYST_EMAIL = `test_analyst_${RUN_ID}@finsight.test`;
const ANALYST_PASS  = 'Analyst$ecure2!';
const TEMP_EMAIL    = `temp_${RUN_ID}@finsight.test`;

// Tokens saved across tests
let adminToken   = '';
let analystToken = '';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Deep-stringifies a value and checks that "password_hash" never appears. */
function assertNoPasswordHash(body) {
  const json = JSON.stringify(body);
  expect(json).not.toContain('password_hash');
}

// ── Lifecycle ───────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Seed a temporary Admin user directly in the DB so we can log in via the API.
  const hash = await bcrypt.hash(ADMIN_PASS, 4);   // low rounds for speed in tests
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'Admin')
     ON CONFLICT (email) DO NOTHING`,
    ['Test Admin', ADMIN_EMAIL, hash],
  );
}, 30_000);

afterAll(async () => {
  // ── Clean up every user created during this run ───────────────────────
  await pool.query(
    'DELETE FROM users WHERE email = ANY($1)',
    [[ADMIN_EMAIL, ANALYST_EMAIL, TEMP_EMAIL]],
  );
  await pool.end();
}, 15_000);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('should reject login with missing fields', async () => {
    const res = await request.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should reject login with wrong email', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.test', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should reject login with wrong password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should succeed with correct credentials and return a JWT', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({
      name:  'Test Admin',
      email: ADMIN_EMAIL,
      role:  'Admin',
    });

    // Save for later tests
    adminToken = res.body.token;
  });

  it('should never include password_hash in login response', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS });

    expect(res.status).toBe(200);
    assertNoPasswordHash(res.body);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Create user (Admin-only)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/users', () => {
  it('should reject creation with missing fields', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('should reject creation with invalid role', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Role', email: 'bad@test.com', password: 'x', role: 'SuperUser' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/role must be one of/i);
  });

  it('should create an Analyst user successfully', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name:     'Test Analyst',
        email:    ANALYST_EMAIL,
        password: ANALYST_PASS,
        role:     'Analyst',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name:  'Test Analyst',
      email: ANALYST_EMAIL,
      role:  'Analyst',
    });
    expect(res.body.user).toHaveProperty('user_id');
  }, 15_000);

  it('should never include password_hash in create-user response', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Temp', email: TEMP_EMAIL, password: 'x', role: 'CFO' });

    expect(res.status).toBe(201);
    assertNoPasswordHash(res.body);
  }, 15_000);

  it('should reject duplicate email with 409', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name:     'Duplicate',
        email:    ANALYST_EMAIL,
        password: 'x',
        role:     'Analyst',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. List users (Admin-only)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('should return a list containing the Analyst we just created', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);

    const analyst = res.body.users.find((u) => u.email === ANALYST_EMAIL);
    expect(analyst).toBeDefined();
    expect(analyst.role).toBe('Analyst');
  });

  it('should never include password_hash in list-users response', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    assertNoPasswordHash(res.body);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Unauthorized access (no token / bad token)
// ─────────────────────────────────────────────────────────────────────────────

describe('Unauthorized access', () => {
  it('should reject admin routes when no Authorization header is sent', async () => {
    const res = await request.get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing|malformed/i);
  });

  it('should reject admin routes with a garbage token', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should reject admin routes when only "Bearer" is sent (no token value)', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Role-based authorization
// ─────────────────────────────────────────────────────────────────────────────

describe('Role-based authorization', () => {
  // Login as Analyst to get a non-admin token
  it('should login as Analyst to obtain a token', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: ANALYST_EMAIL, password: ANALYST_PASS });

    expect(res.status).toBe(200);
    analystToken = res.body.token;
  });

  it('should forbid Analyst from listing users (GET /api/admin/users)', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });

  it('should forbid Analyst from creating users (POST /api/admin/users)', async () => {
    const res = await request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        name:     'Should Fail',
        email:    `blocked_${RUN_ID}@finsight.test`,
        password: 'x',
        role:     'Analyst',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden/i);
  });
});
