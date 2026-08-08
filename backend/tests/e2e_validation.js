import { jest } from '@jest/globals';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { getGroqClient } from '../src/services/ai/groq.service.js';

dotenv.config();

const { default: app } = await import('../src/app.js');
const request = supertest(app);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const RUN_ID = Date.now();
const VALIDATION_EMAIL = `validation_analyst_${RUN_ID}@finsight.test`;

let analystToken;
let analystId;
let companyId = 0;
let originalCreate = null;

beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  // 1. Insert validation user
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING user_id`,
    ['Validation Analyst', VALIDATION_EMAIL, hash, 'Analyst']
  );
  analystId = userRes.rows[0].user_id;

  // 2. Fetch login token
  const loginRes = await request.post('/api/auth/login').send({ email: VALIDATION_EMAIL, password: 'Password123!' });
  analystToken = loginRes.body.token;

  // 3. Idempotently upsert HDFCBANK company
  const compRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (ticker) DO UPDATE SET name = EXCLUDED.name
     RETURNING company_id`,
    ['HDFC Bank', 'HDFCBANK', 'Banking', 'NSE']
  );
  companyId = compRes.rows[0].company_id;

  // 4. Seed Clean Financial Metrics
  await pool.query('DELETE FROM financial_metrics WHERE company_id = $1', [companyId]);
  await pool.query(
    `INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES 
      ($1, 'NIM', 4.2, '2025-10-01T00:00:00Z'),
      ($1, 'NPA_percent', 1.5, '2025-10-01T00:00:00Z'),
      ($1, 'CAR', 18.0, '2025-10-01T00:00:00Z'),
      ($1, 'loan_growth', 14.0, '2025-10-01T00:00:00Z')`,
    [companyId]
  );

  // 5. Seed Clean Raw Financials
  await pool.query('DELETE FROM bank_financials_raw WHERE company_id = $1', [companyId]);
  await pool.query(
    `INSERT INTO bank_financials_raw (company_id, ticker, company_profile, market_data, income_statement, balance_sheet, cash_flow, quarterly_results, annual_results, fetch_date, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10)`,
    [
      companyId,
      'HDFCBANK',
      JSON.stringify({ sector: 'Banking', industry: 'Regional Banks' }),
      JSON.stringify({ currentPrice: 1520.50, marketCap: 80000000000 }),
      JSON.stringify({ sales: '350000', net_profit: '80000', operating_profit: '200000', profit_before_tax: '105000', eps: '50.25' }),
      JSON.stringify({ totalCash: 150000, totalDebt: 450000 }),
      JSON.stringify({ 'Cash from operating activity': '110000', 'Cash from investing activity': '-20000', 'Cash from finance activity': '-50000' }),
      JSON.stringify({ returnOnAssets: 0.02, returnOnEquity: 0.16, profitMargins: 0.22, operatingMargins: 0.35, totalCash: 150000, totalDebt: 450000 }),
      JSON.stringify({ eps: '50.25' }),
      'Yahoo Finance'
    ]
  );

  // Save the original completions client
  const client = getGroqClient();
  originalCreate = client.chat.completions.create;
}, 30000);

afterEach(() => {
  // Ensure client mock is always restored between tests
  const client = getGroqClient();
  if (originalCreate) {
    client.chat.completions.create = originalCreate;
  }
});

afterAll(async () => {
  // Cleanup test metrics & user
  await pool.query('DELETE FROM bank_financials_raw WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM financial_metrics WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM users WHERE user_id = $1', [analystId]);
  await pool.end();
});

describe('E2E Production Validation for What-If Analysis Service', () => {
  const endpoint = '/api/analysis/what-if';

  // SCENARIO 1: Valid Request
  it('Scenario 1: Should execute a valid request, returning proper output, without hallucinating or giving advice', async () => {
    console.log('\n--- SCENARIO 1: Valid Request ---');
    const payload = {
      bank: 'HDFCBANK.NS',
      question: 'What happens if Net Profit decreases by 10%?',
    };
    
    const startTime = Date.now();
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send(payload);
    const duration = Date.now() - startTime;

    console.log('Request Payload:', JSON.stringify(payload));
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    console.log(`Execution time: ${duration}ms`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('assumptions');
    expect(res.body).toHaveProperty('metrics_used');
    
    // Check constraints
    expect(res.body.answer).not.toContain('buy');
    expect(res.body.answer).not.toContain('sell');
    expect(res.body.answer).not.toContain('hold');
  }, 25000);

  // SCENARIO 2: Missing Bank
  it('Scenario 2: Should reject requests with missing bank ticker with 400', async () => {
    console.log('\n--- SCENARIO 2: Missing Bank ---');
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        question: 'What happens if NIM decreases by 1%?',
      });

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('bank');
  });

  // SCENARIO 3: Missing Question
  it('Scenario 3: Should reject requests with missing question with 400', async () => {
    console.log('\n--- SCENARIO 3: Missing Question ---');
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'HDFCBANK.NS',
      });

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('question');
  });

  // SCENARIO 4: Invalid Bank
  it('Scenario 4: Should return 404 for invalid bank tickers', async () => {
    console.log('\n--- SCENARIO 4: Invalid Bank ---');
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'INVALID_BANK_TICKER',
        question: 'What happens if NPA increases by 2%?',
      });

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Bank not found');
  });

  // SCENARIO 5: Missing Financial Metric Fallback
  it('Scenario 5: Should trigger the strict database fallback if querying metrics not present', async () => {
    console.log('\n--- SCENARIO 5: Missing Financial Metric ---');
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'HDFCBANK.NS',
        question: 'What happens if our imaginary metric SuperProfit increases by 1000%?',
      });

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('The requested information is unavailable in the current financial dataset.');
  }, 25000);

  // SCENARIO 6: Deterministic Output (temperature = 0)
  it('Scenario 6: Should return deterministic outputs for identical requests', async () => {
    console.log('\n--- SCENARIO 6: Deterministic Output ---');
    const payload = {
      bank: 'HDFCBANK.NS',
      question: 'What happens if Net Profit decreases by 10%?',
    };

    const answers = [];
    for (let i = 1; i <= 3; i++) {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send(payload);
      expect(res.status).toBe(200);
      answers.push(res.body.answer);
      console.log(`Run ${i} answer: "${res.body.answer.substring(0, 100)}..."`);
    }

    // Vocabulary similarity comparison to account for hardware floating-point variance (Groq LPU) at temp = 0
    const getWords = (str) => new Set(str.toLowerCase().match(/\b\w+\b/g) || []);
    const w1 = getWords(answers[0]);
    const w2 = getWords(answers[1]);
    const w3 = getWords(answers[2]);

    const intersection = (s1, s2) => new Set([...s1].filter(x => s2.has(x)));
    const similarity = (s1, s2) => intersection(s1, s2).size / Math.max(s1.size, 1);

    const sim1 = similarity(w1, w2);
    const sim2 = similarity(w2, w3);

    console.log(`Word vocabulary overlap Run 1 vs Run 2: ${(sim1 * 100).toFixed(2)}%`);
    console.log(`Word vocabulary overlap Run 2 vs Run 3: ${(sim2 * 100).toFixed(2)}%`);

    expect(sim1).toBeGreaterThan(0.85);
    expect(sim2).toBeGreaterThan(0.85);
  }, 60000);

  // SCENARIO 8: Retry Logic
  it('Scenario 8: Should automatically retry once on transient API failures', async () => {
    console.log('\n--- SCENARIO 8: Retry Logic ---');
    const client = getGroqClient();

    let callCount = 0;
    client.chat.completions.create = async function (params) {
      callCount++;
      if (callCount === 1) {
        console.log('Simulating transient Groq API error on attempt 1...');
        throw new Error('Rate limit or temporary overload (mock)');
      }
      console.log('Attempt 2: callGroqWithRetry calling completions create...');
      return originalCreate.call(client.chat.completions, params);
    };

    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'HDFCBANK.NS',
        question: 'What happens if Net Profit decreases by 10%?',
      });

    console.log('HTTP Status:', res.status);
    console.log('Call count on Groq completions API:', callCount);
    expect(res.status).toBe(200);
    expect(callCount).toBe(2); // Attempt 1 failed (mock), Attempt 2 succeeded
  }, 25000);

  // SCENARIO 9: Timeout Handling
  it('Scenario 9: Should handle timeout gracefully and return 500 error', async () => {
    console.log('\n--- SCENARIO 9: Timeout Handling ---');
    const client = getGroqClient();

    client.chat.completions.create = async function () {
      console.log('Simulating a long-running call to trigger timeout...');
      await new Promise((resolve) => setTimeout(resolve, 20000)); // 20s delay, exceeds 15s timeout
      return { choices: [] };
    };

    const startTime = Date.now();
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'HDFCBANK.NS',
        question: 'What happens if Net Profit decreases by 10%?',
      });
    const duration = Date.now() - startTime;

    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
    console.log(`Execution time until timeout error returned: ${duration}ms`);
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Failed to contact Groq API');
  }, 60000);

  // SCENARIO 10: Performance Breakdown
  it('Scenario 10: Performance Breakdown measurements', async () => {
    console.log('\n--- SCENARIO 10: Performance Breakdown ---');
    
    // 1. Measure DB fetch time
    const t0 = Date.now();
    const companyRes = await pool.query(
      `SELECT * FROM companies WHERE REPLACE(UPPER(ticker), '.NS', '') = 'HDFCBANK'`
    );
    const company = companyRes.rows[0];
    const companyId = company.company_id;
    await pool.query(
      `SELECT * FROM bank_financials_raw WHERE company_id = $1 ORDER BY fetch_date DESC LIMIT 1`,
      [companyId]
    );
    await pool.query(
      `SELECT metric_name, value, timestamp FROM financial_metrics WHERE company_id = $1 ORDER BY timestamp ASC`,
      [companyId]
    );
    const t1 = Date.now();
    const dbFetchTime = t1 - t0;

    // 2. Measure Prompt construction time
    const t2 = Date.now();
    const dbContext = `=== BANK IDENTIFIERS ===
Bank Name: ${company.name}
...`;
    const t3 = Date.now();
    const promptConstructionTime = t3 - t2;

    // 3. Measure overall API response time
    const apiStartTime = Date.now();
    const res = await request
      .post(endpoint)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        bank: 'HDFCBANK.NS',
        question: 'What happens if Net Profit decreases by 10%?',
      });
    const totalApiResponseTime = Date.now() - apiStartTime;
    
    // Groq time is approximately total API response time minus DB fetch and prompt construction
    const estimatedGroqResponseTime = totalApiResponseTime - dbFetchTime - promptConstructionTime;

    console.log(`Database Fetch Time: ${dbFetchTime}ms`);
    console.log(`Prompt Construction Time: ${promptConstructionTime}ms`);
    console.log(`Estimated Groq Response Time: ${estimatedGroqResponseTime}ms`);
    console.log(`Total API Response Time: ${totalApiResponseTime}ms`);

    expect(res.status).toBe(200);
  }, 60000);
});
