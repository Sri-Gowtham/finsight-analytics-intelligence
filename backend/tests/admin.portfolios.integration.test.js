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
const ADMIN_EMAIL = `admin_port_${RUN_ID}@finsight.test`;
const CFO_EMAIL = `cfo_port_${RUN_ID}@finsight.test`;
const ANALYST_EMAIL = `analyst_port_${RUN_ID}@finsight.test`;
const CLIENT_NAME = `TestClient_${RUN_ID}`;

let adminToken, cfoToken, analystToken;
let adminId, cfoId, analystId;
let comp1Id = 0, comp2Id = 0, comp3Id = 0;

beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  // 1. Insert Users
  const usersToInsert = [
    ['Admin User', ADMIN_EMAIL, hash, 'Admin'],
    ['CFO User', CFO_EMAIL, hash, 'CFO'],
    ['Analyst', ANALYST_EMAIL, hash, 'Analyst'],
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
  [adminId, cfoId, analystId] = userIds;

  // 2. Login to get tokens
  const getTokens = async (email) => {
    const res = await request.post('/api/auth/login').send({ email, password: 'Password123!' });
    return res.body.token;
  };
  adminToken = await getTokens(ADMIN_EMAIL);
  cfoToken = await getTokens(CFO_EMAIL);
  analystToken = await getTokens(ANALYST_EMAIL);

  // 3. Insert Dummy Companies with valid tickers
  const compRes1 = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`Bank1_${RUN_ID}`, `BK1_${RUN_ID}`, 'Banking', 'NYSE']
  );
  comp1Id = compRes1.rows[0].company_id;

  const compRes2 = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`Bank2_${RUN_ID}`, `BK2_${RUN_ID}`, 'Banking', 'NYSE']
  );
  comp2Id = compRes2.rows[0].company_id;

  const compRes3 = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`Bank3_${RUN_ID}`, `BK3_${RUN_ID}`, 'Banking', 'NYSE']
  );
  comp3Id = compRes3.rows[0].company_id;

}, 30000);

afterAll(async () => {
  // Clean up
  await pool.query('DELETE FROM client_portfolios WHERE uploaded_by = ANY($1::int[])', [[adminId]]);
  await pool.query('DELETE FROM companies WHERE company_id = ANY($1::int[])', [[comp1Id, comp2Id, comp3Id]]);
  await pool.query('DELETE FROM users WHERE user_id = ANY($1::int[])', [[adminId, cfoId, analystId]]);
  await pool.end();
});

describe('Admin Portfolio Endpoints', () => {
  
  let insertedPortfolioId;

  describe('POST /api/admin/portfolios', () => {
    it('should forbid Analyst and CFO from uploading', async () => {
      const payload = { client_name: CLIENT_NAME, bank_tickers: [`BK1_${RUN_ID}`] };
      
      const resAnalyst = await request.post('/api/admin/portfolios').set('Authorization', `Bearer ${analystToken}`).send(payload);
      expect(resAnalyst.status).toBe(403);
      
      const resCfo = await request.post('/api/admin/portfolios').set('Authorization', `Bearer ${cfoToken}`).send(payload);
      expect(resCfo.status).toBe(403);
    });

    it('should upload successfully with all valid tickers', async () => {
      const payload = { client_name: CLIENT_NAME, bank_tickers: [`BK1_${RUN_ID}`, `BK2_${RUN_ID}`] };
      const res = await request.post('/api/admin/portfolios').set('Authorization', `Bearer ${adminToken}`).send(payload);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.client_name).toBe(CLIENT_NAME);
      expect(res.body.inserted_count).toBe(2);
      expect(res.body.skipped_duplicates).toBe(0);
      expect(res.body.failed_tickers.length).toBe(0);
    });

    it('should silently skip duplicate entries for the same client', async () => {
      // Re-upload the exact same payload
      const payload = { client_name: CLIENT_NAME, bank_tickers: [`BK1_${RUN_ID}`, `BK2_${RUN_ID}`] };
      const res = await request.post('/api/admin/portfolios').set('Authorization', `Bearer ${adminToken}`).send(payload);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inserted_count).toBe(0);
      expect(res.body.skipped_duplicates).toBe(2);
      expect(res.body.failed_tickers.length).toBe(0);
    });

    it('should handle a mix of valid, duplicate, and invalid tickers gracefully', async () => {
      const payload = { 
        client_name: CLIENT_NAME, 
        bank_tickers: [`BK1_${RUN_ID}`, `BK3_${RUN_ID}`, 'INVALID_TICKER_123'] 
      };
      const res = await request.post('/api/admin/portfolios').set('Authorization', `Bearer ${adminToken}`).send(payload);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.inserted_count).toBe(1); // BK3
      expect(res.body.skipped_duplicates).toBe(1); // BK1
      expect(res.body.failed_tickers).toContain('INVALID_TICKER_123');
      expect(res.body.failed_tickers.length).toBe(1);
    });
  });

  describe('PUT /api/admin/portfolios/:id', () => {
    beforeAll(async () => {
      // Fetch an ID to update
      const res = await pool.query('SELECT id FROM client_portfolios WHERE client_name = $1 LIMIT 1', [CLIENT_NAME]);
      insertedPortfolioId = res.rows[0].id;
    });

    it('should forbid Analyst and CFO from updating', async () => {
      const payload = { company_id: comp3Id };
      const resAnalyst = await request.put(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${analystToken}`).send(payload);
      expect(resAnalyst.status).toBe(403);
      
      const resCfo = await request.put(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${cfoToken}`).send(payload);
      expect(resCfo.status).toBe(403);
    });

    it('should return 404 for a non-existent ID', async () => {
      const res = await request.put('/api/admin/portfolios/999999').set('Authorization', `Bearer ${adminToken}`).send({ company_id: comp3Id });
      expect(res.status).toBe(404);
    });

    it('should return 404 and leave portfolio unchanged when company_id does not exist', async () => {
      // Get current company_id before test
      const beforeRes = await pool.query('SELECT company_id FROM client_portfolios WHERE id = $1', [insertedPortfolioId]);
      const originalCompanyId = beforeRes.rows[0].company_id;

      const res = await request
        .put(`/api/admin/portfolios/${insertedPortfolioId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ company_id: 999999 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Company not found');

      // Verify DB row remains unchanged
      const afterRes = await pool.query('SELECT company_id FROM client_portfolios WHERE id = $1', [insertedPortfolioId]);
      expect(afterRes.rows[0].company_id).toBe(originalCompanyId);
    });

    it('should update an entry successfully', async () => {
      const res = await request.put(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${adminToken}`).send({ company_id: comp3Id });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify DB change
      const dbRes = await pool.query('SELECT company_id FROM client_portfolios WHERE id = $1', [insertedPortfolioId]);
      expect(dbRes.rows[0].company_id).toBe(comp3Id);
    });
  });

  describe('DELETE /api/admin/portfolios/:id', () => {
    it('should forbid Analyst and CFO from deleting', async () => {
      const resAnalyst = await request.delete(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${analystToken}`);
      expect(resAnalyst.status).toBe(403);
      
      const resCfo = await request.delete(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${cfoToken}`);
      expect(resCfo.status).toBe(403);
    });

    it('should return 404 for a non-existent ID', async () => {
      const res = await request.delete('/api/admin/portfolios/999999').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should delete an entry successfully and return success, deleted_id, and message', async () => {
      const res = await request.delete(`/api/admin/portfolios/${insertedPortfolioId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deleted_id).toBe(insertedPortfolioId);
      expect(res.body.message).toBe('Portfolio entry deleted successfully');
      
      // Verify DB deletion
      const dbRes = await pool.query('SELECT id FROM client_portfolios WHERE id = $1', [insertedPortfolioId]);
      expect(dbRes.rows.length).toBe(0);
    });
  });

});
