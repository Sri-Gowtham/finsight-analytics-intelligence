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

const RUN_ID = Date.now();
const ADMIN_EMAIL = `admin_whatif_${RUN_ID}@finsight.test`;
const CFO_EMAIL = `cfo_whatif_${RUN_ID}@finsight.test`;
const ANALYST1_EMAIL = `analyst1_whatif_${RUN_ID}@finsight.test`;
const ANALYST2_EMAIL = `analyst2_whatif_${RUN_ID}@finsight.test`;

let adminToken, cfoToken, analyst1Token, analyst2Token;
let adminId, cfoId, analyst1Id, analyst2Id;
let companyId = 0, peerId = 0, techId = 0;

beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  // 1. Insert Users
  const usersToInsert = [
    ['Admin User', ADMIN_EMAIL, hash, 'Admin'],
    ['CFO User', CFO_EMAIL, hash, 'CFO'],
    ['Analyst 1', ANALYST1_EMAIL, hash, 'Analyst'],
    ['Analyst 2', ANALYST2_EMAIL, hash, 'Analyst'],
  ];

  const userIds = [];
  for (const [name, email, pHash, role] of usersToInsert) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      [name, email, pHash, role]
    );
    userIds.push(res.rows[0].user_id);
  }
  [adminId, cfoId, analyst1Id, analyst2Id] = userIds;

  // 2. Login to get tokens
  const getTokens = async (email) => {
    const res = await request.post('/api/auth/login').send({ email, password: 'Password123!' });
    return res.body.token;
  };
  adminToken = await getTokens(ADMIN_EMAIL);
  cfoToken = await getTokens(CFO_EMAIL);
  analyst1Token = await getTokens(ANALYST1_EMAIL);
  analyst2Token = await getTokens(ANALYST2_EMAIL);

  // 3. Insert Dummy Companies
  const compRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`WhatIfBank_${RUN_ID}`, `WIB_${RUN_ID}`, 'Banking', 'NYSE']
  );
  companyId = compRes.rows[0].company_id;

  const peerRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`PeerBank_${RUN_ID}`, `PB_${RUN_ID}`, 'Banking', 'NYSE']
  );
  peerId = peerRes.rows[0].company_id;

  const techRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`TechCompany_${RUN_ID}`, `TC_${RUN_ID}`, 'Technology', 'NASDAQ']
  );
  techId = techRes.rows[0].company_id;

  // 4. Insert Financial Metrics
  await pool.query(
    `INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES 
      -- Main bank: old NIM is 3.5, latest is 3.8
      ($1, 'NIM', 3.5, '2023-01-01T00:00:00Z'),
      ($1, 'NIM', 3.8, '2023-06-01T00:00:00Z'),
      ($1, 'CAR', 15.2, '2023-01-01T00:00:00Z'),
      
      -- Peer bank in 'Banking': NIM is 4.2
      ($2, 'NIM', 4.2, '2023-06-01T00:00:00Z'),

      -- Tech company: NIM is 10.0 (should be excluded from Banking sector average)
      ($3, 'NIM', 10.0, '2023-06-01T00:00:00Z')`,
    [companyId, peerId, techId]
  );
}, 30000);

afterAll(async () => {
  await pool.query('DELETE FROM whatif_scenarios WHERE company_id = ANY($1::int[])', [[companyId, peerId, techId]]);
  await pool.query('DELETE FROM financial_metrics WHERE company_id = ANY($1::int[])', [[companyId, peerId, techId]]);
  await pool.query('DELETE FROM companies WHERE company_id = ANY($1::int[])', [[companyId, peerId, techId]]);
  await pool.query('DELETE FROM users WHERE user_id = ANY($1::int[])', [[adminId, cfoId, analyst1Id, analyst2Id]]);
  await pool.end();
});

describe('What-If Scenario Endpoints', () => {

  describe('POST /api/whatif', () => {
    beforeAll(() => {
      // Mock global fetch for OpenAI call
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Mocked insight text. This is a scenario estimate, not a prediction or guarantee.' } }]
          }),
        })
      );
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should forbid CFO and Admin from creating scenarios', async () => {
      const resCfo = await request.post('/api/whatif').set('Authorization', `Bearer ${cfoToken}`).send({
        company_id: companyId,
        metric_name: 'NIM',
        hypothetical_value: 4.0
      });
      expect(resCfo.status).toBe(403);

      const resAdmin = await request.post('/api/whatif').set('Authorization', `Bearer ${adminToken}`).send({
        company_id: companyId,
        metric_name: 'NIM',
        hypothetical_value: 4.0
      });
      expect(resAdmin.status).toBe(403);
    });

    it('should reject invalid metric_name', async () => {
      const res = await request.post('/api/whatif').set('Authorization', `Bearer ${analyst1Token}`).send({
        company_id: companyId,
        metric_name: 'INVALID_METRIC',
        hypothetical_value: 4.0
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid metric_name/);
    });

    it('should reject non-existent company_id', async () => {
      const res = await request.post('/api/whatif').set('Authorization', `Bearer ${analyst1Token}`).send({
        company_id: 999999,
        metric_name: 'NIM',
        hypothetical_value: 4.0
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Company not found/);
    });

    it('should successfully create a scenario as an Analyst and compute correct sector_avg', async () => {
      // Clear mock history
      global.fetch.mockClear();

      const res = await request.post('/api/whatif').set('Authorization', `Bearer ${analyst1Token}`).send({
        company_id: companyId,
        metric_name: 'NIM',
        hypothetical_value: 4.8 // +1.0 delta from 3.8
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('scenario_id');
      expect(res.body.insight).toContain('Mocked insight text');
      
      // Verify mathematical calculation passed to OpenAI
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArg = JSON.parse(global.fetch.mock.calls[0][1].body);
      const promptText = callArg.messages[1].content;
      
      // Known data:
      // Current value for main bank = 3.8 (latest)
      // Hypothetical value = 4.8
      // Delta = 1.0
      // Percent change = (1.0 / 3.8) * 100 = 26.315789...
      // Sector average: Banking only => (3.8 + 4.2) / 2 = 4.0 (ignoring Tech's 10.0)
      
      expect(promptText).toContain('Current value: 3.8');
      expect(promptText).toContain('Hypothetical value: 4.8');
      expect(promptText).toContain('Delta: 1');
      expect(promptText).toContain('Sector average: 4');
      
      // Also create a second scenario for Analyst 2
      await request.post('/api/whatif').set('Authorization', `Bearer ${analyst2Token}`).send({
        company_id: companyId,
        metric_name: 'CAR',
        hypothetical_value: 16.0
      });
    });

    it('should append the disclaimer if the AI omits it', async () => {
      // Temporarily override the mock to omit the disclaimer
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'AI prediction says it will go up.' } }]
          }),
        })
      );

      const res = await request.post('/api/whatif').set('Authorization', `Bearer ${analyst1Token}`).send({
        company_id: companyId,
        metric_name: 'NIM',
        hypothetical_value: 4.5
      });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.insight).toContain('AI prediction says it will go up.');
      expect(res.body.insight).toContain('This is a scenario estimate, not a prediction or guarantee.');
      
      // Restore the original mock for subsequent tests if necessary
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Mocked insight text. This is a scenario estimate, not a prediction or guarantee.' } }]
          }),
        })
      );
    });
  });

  describe('GET /api/whatif/history/:analystId', () => {
    it('should allow Analyst to view their own history', async () => {
      const res = await request.get(`/api/whatif/history/${analyst1Id}`).set('Authorization', `Bearer ${analyst1Token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThanOrEqual(1);
      expect(res.body.history[0].analyst_id).toBe(analyst1Id);
    });

    it('should forbid Analyst A from viewing Analyst B history', async () => {
      const res = await request.get(`/api/whatif/history/${analyst2Id}`).set('Authorization', `Bearer ${analyst1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('should allow Admin to view any analyst history', async () => {
      const res = await request.get(`/api/whatif/history/${analyst2Id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThanOrEqual(1);
      expect(res.body.history[0].analyst_id).toBe(analyst2Id);
    });
  });

});
