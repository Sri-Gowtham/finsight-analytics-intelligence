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
const CFO_EMAIL = `cfo_${RUN_ID}@finsight.test`;
const CFO_PASS = 'Cfo$ecure1!';
const ANALYST_EMAIL = `analyst_${RUN_ID}@finsight.test`;
const ANALYST_PASS = 'Analyst$ecure2!';

let cfoToken = '';
let analystToken = '';
let cfoId = 0;
let analystId = 0;
let companyId = 0;
let companyId2 = 0;

beforeAll(async () => {
  await pool.query("DELETE FROM client_portfolios WHERE client_name IN ('Important Client', 'Another Client')");
  
  const hash1 = await bcrypt.hash(CFO_PASS, 4);
  const hash2 = await bcrypt.hash(ANALYST_PASS, 4);

  // 1. Insert Users
  const cfoRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'CFO') RETURNING user_id`,
    ['Test CFO', CFO_EMAIL, hash1],
  );
  cfoId = cfoRes.rows[0].user_id;

  const analystRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'Analyst') RETURNING user_id`,
    ['Test Analyst', ANALYST_EMAIL, hash2],
  );
  analystId = analystRes.rows[0].user_id;

  // 2. Login to get tokens
  const resCfo = await request.post('/api/auth/login').send({ email: CFO_EMAIL, password: CFO_PASS });
  cfoToken = resCfo.body.token;

  const resAnalyst = await request.post('/api/auth/login').send({ email: ANALYST_EMAIL, password: ANALYST_PASS });
  analystToken = resAnalyst.body.token;

  // 3. Insert Dummy Company
  const compRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`TestBank_${RUN_ID}`, `TB_${RUN_ID}`, 'Financials', 'NYSE'],
  );
  companyId = compRes.rows[0].company_id;

  const compRes2 = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`OtherBank_${RUN_ID}`, `OB_${RUN_ID}`, 'Financials', 'NASDAQ'],
  );
  companyId2 = compRes2.rows[0].company_id;

  // 4. Insert Financial Metrics
  // We need multiple timestamps to test history
  await pool.query(
    `INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES 
      ($1, 'NIM', 3.5, '2023-01-01T00:00:00Z'),
      ($1, 'NIM', 3.8, '2023-06-01T00:00:00Z'),
      ($1, 'CAR', 15.2, '2023-01-01T00:00:00Z')`,
    [companyId],
  );

  // 5. Insert Insights
  await pool.query(
    `INSERT INTO insights (company_id, insight_type, generated_text, source_metric_ids, created_at) VALUES 
      ($1, 'Risk', 'NIM increased due to high interest rates.', '1,2', '2023-06-02T00:00:00Z'),
      ($1, 'Growth', 'Steady growth expected.', '3', '2023-01-02T00:00:00Z')`,
    [companyId],
  );

  // 6. Insert Client Portfolio
  await pool.query(
    `INSERT INTO client_portfolios (client_name, company_id, uploaded_by) VALUES 
      ($1, $2, $3)`,
    ['Important Client', companyId, cfoId],
  );

  await pool.query(
    `INSERT INTO client_portfolios (client_name, company_id, uploaded_by) VALUES 
      ($1, $2, $3)`,
    ['Another Client', companyId2, cfoId],
  );
}, 30000);

afterAll(async () => {
  await pool.query('DELETE FROM client_portfolios WHERE company_id IN ($1, $2)', [companyId, companyId2]);
  await pool.query('DELETE FROM insights WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM financial_metrics WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM companies WHERE company_id IN ($1, $2)', [companyId, companyId2]);
  await pool.query('DELETE FROM users WHERE user_id IN ($1, $2)', [cfoId, analystId]);
  await pool.end();
}, 30000);

describe('Read Endpoints Integration Tests', () => {

  describe('GET /api/companies', () => {
    it('should require authentication', async () => {
      const res = await request.get('/api/companies');
      expect(res.status).toBe(401);
    });

    it('should list companies', async () => {
      const res = await request.get('/api/companies').set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.companies.some(c => c.company_id === companyId)).toBe(true);
    });
  });

  describe('GET /api/companies/:id/metrics', () => {
    it('should return 404 for invalid company_id', async () => {
      const res = await request.get('/api/companies/999999/metrics').set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(404);
    });

    it('should return latest metrics', async () => {
      const res = await request.get(`/api/companies/${companyId}/metrics`).set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.company_id).toBe(companyId);
      expect(res.body.metrics.length).toBe(2); // NIM and CAR
      const nim = res.body.metrics.find(m => m.metric_name === 'NIM');
      expect(Number(nim.value)).toBe(3.8); // Should be the latest value
    });
  });

  describe('GET /api/companies/:id/metrics/history', () => {
    it('should return 400 if timestamp is missing', async () => {
      const res = await request.get(`/api/companies/${companyId}/metrics/history`).set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(400);
    });

    it('should return 404 if company does not exist', async () => {
      const res = await request.get('/api/companies/999999/metrics/history?timestamp=2023-05-01T00:00:00Z').set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 if no data exists before timestamp', async () => {
      const res = await request.get(`/api/companies/${companyId}/metrics/history?timestamp=2022-01-01T00:00:00Z`).set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(404);
    });

    it('should return metrics as of a specific timestamp', async () => {
      const res = await request.get(`/api/companies/${companyId}/metrics/history?timestamp=2023-05-01T00:00:00Z`).set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.metrics.length).toBe(2);
      const nim = res.body.metrics.find(m => m.metric_name === 'NIM');
      expect(Number(nim.value)).toBe(3.5); // Should be the earlier value
    });
  });

  describe('GET /api/companies/:id/insights', () => {
    it('should return 404 for invalid company', async () => {
      const res = await request.get('/api/companies/999999/insights').set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(404);
    });

    it('should return full insight for Analyst', async () => {
      const res = await request.get(`/api/companies/${companyId}/insights`).set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
      expect(res.body.insights.length).toBe(2);
      // Ensure most recent first
      expect(res.body.insights[0].generated_text).toMatch(/increased due to high interest rates/);
      expect(res.body.insights[0]).toHaveProperty('source_metric_ids');
    });

    it('should strip source_metric_ids for CFO', async () => {
      const res = await request.get(`/api/companies/${companyId}/insights`).set('Authorization', `Bearer ${cfoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.insights.length).toBe(2);
      expect(res.body.insights[0]).not.toHaveProperty('source_metric_ids');
      expect(res.body.insights[0]).toHaveProperty('generated_text');
      expect(res.body.insights[0]).toHaveProperty('created_at');
    });
  });

  describe('GET /api/clients/:clientName/portfolio', () => {
    it('should return 404 if no portfolio exists', async () => {
      const res = await request.get('/api/clients/Nobody/portfolio').set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(404);
    });

    it('should return client portfolio with joined latest metrics', async () => {
      const res = await request.get(`/api/clients/Important%20Client/portfolio`).set('Authorization', `Bearer ${cfoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.portfolio.length).toBe(1);
      const item = res.body.portfolio[0];
      expect(item.company_id).toBe(companyId);
      expect(item.metrics).toBeDefined();
      expect(item.metrics.length).toBe(2);
      const nim = item.metrics.find(m => m.metric_name === 'NIM');
      expect(Number(nim.value)).toBe(3.8); // joined latest metric
    });

    it('should isolate portfolios between clients', async () => {
      const res = await request.get(`/api/clients/Another%20Client/portfolio`).set('Authorization', `Bearer ${cfoToken}`);
      expect(res.status).toBe(200);
      expect(res.body.portfolio.length).toBe(1);
      const item = res.body.portfolio[0];
      expect(item.company_id).toBe(companyId2); // should only get companyId2 for Another Client
      expect(res.body.portfolio.some(p => p.company_id === companyId)).toBe(false);
    });
  });

});
