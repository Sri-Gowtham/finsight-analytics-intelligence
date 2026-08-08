import { jest } from '@jest/globals';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Mock Groq SDK to avoid making actual API calls during tests
jest.unstable_mockModule('groq-sdk', () => {
  const mockClass = jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async (params) => {
            // Simulate timeout if parameter includes a specific flag for testing timeouts
            if (params.messages && params.messages.some(m => m.content.includes('SIMULATE_TIMEOUT'))) {
              await new Promise(resolve => setTimeout(resolve, 20000));
            }
            if (params.messages && params.messages.some(m => m.content.includes('MISSING_DATA'))) {
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        answer: 'The requested information is unavailable in the current financial dataset.',
                        assumptions: [],
                        metrics_used: [],
                      }),
                    },
                  },
                ],
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 20,
                  total_tokens: 120
                },
                model: 'llama-3.3-70b-versatile'
              };
            }
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      answer: 'According to the database, the latest NIM is 4.2% and NPA is 1.5%. An increase in NPA by 2.0% will bring the hypothetical NPA to 3.5%, raising provisioning costs.',
                      assumptions: ['Provisioning increases proportionally to NPA growth', 'Other income streams remain static'],
                      metrics_used: ['NIM', 'NPA_percent'],
                    }),
                  },
                },
              ],
              usage: {
                prompt_tokens: 150,
                completion_tokens: 80,
                total_tokens: 230
              },
              model: 'llama-3.3-70b-versatile'
            };
          }),
        },
      },
    };
  });
  return {
    default: mockClass,
  };
});

const { default: app } = await import('../src/app.js');
const request = supertest(app);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const RUN_ID = Date.now();
const ADMIN_EMAIL = `admin_analysis_${RUN_ID}@finsight.test`;
const CFO_EMAIL = `cfo_analysis_${RUN_ID}@finsight.test`;
const ANALYST_EMAIL = `analyst_analysis_${RUN_ID}@finsight.test`;
const STRANGER_EMAIL = `stranger_analysis_${RUN_ID}@finsight.test`;

let adminToken, cfoToken, analystToken, strangerToken;
let adminId, cfoId, analystId, strangerId;
let companyId = 0;

beforeAll(async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  // 1. Insert Test Users
  const usersToInsert = [
    ['Admin User', ADMIN_EMAIL, hash, 'Admin'],
    ['CFO User', CFO_EMAIL, hash, 'CFO'],
    ['Analyst User', ANALYST_EMAIL, hash, 'Analyst'],
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

  // Insert a user with no permitted roles for this endpoint (e.g. we don't have stranger role, but we can verify auth without token or create user and check if role checking works)
  
  // 2. Fetch login tokens
  const login = async (email) => {
    const res = await request.post('/api/auth/login').send({ email, password: 'Password123!' });
    return res.body.token;
  };
  adminToken = await login(ADMIN_EMAIL);
  cfoToken = await login(CFO_EMAIL);
  analystToken = await login(ANALYST_EMAIL);

  // 3. Insert Dummy Company
  const compRes = await pool.query(
    `INSERT INTO companies (name, ticker, sector, exchange)
     VALUES ($1, $2, $3, $4) RETURNING company_id`,
    [`AnalysisBank_${RUN_ID}`, `TESTBANK_${RUN_ID}`, 'Banking', 'NSE']
  );
  companyId = compRes.rows[0].company_id;

  // 4. Insert Financial Metrics
  await pool.query(
    `INSERT INTO financial_metrics (company_id, metric_name, value, timestamp) VALUES 
      ($1, 'NIM', 4.2, '2024-10-01T00:00:00Z'),
      ($1, 'NPA_percent', 1.5, '2024-10-01T00:00:00Z')`,
    [companyId]
  );

  await pool.query(
    `INSERT INTO bank_financials_raw (company_id, ticker, balance_sheet, income_statement, fetch_date)
     VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
    [companyId, `TESTBANK_${RUN_ID}`, JSON.stringify({ TotalAssets: 1000000 }), JSON.stringify({ NetIncome: 50000 })]
  );
}, 30000);

afterAll(async () => {
  await pool.query('DELETE FROM bank_financials_raw WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM financial_metrics WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM companies WHERE company_id = $1', [companyId]);
  await pool.query('DELETE FROM users WHERE user_id = ANY($1::int[])', [[adminId, cfoId, analystId]]);
  await pool.end();
});

describe('AI What-If Analysis Integration Tests', () => {
  const endpoint = '/api/analysis/what-if';

  describe('Authentication & Authorization', () => {
    it('should reject requests without a token', async () => {
      const res = await request.post(endpoint).send({
        bank: `TESTBANK_${RUN_ID}`,
        question: 'What happens if NPA increases by 2%?',
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should permit Analysts to access the endpoint', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}`,
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('assumptions');
      expect(res.body).toHaveProperty('metrics_used');
    });

    it('should permit CFOs to access the endpoint', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${cfoToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}`,
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(200);
    });

    it('should permit Admins to access the endpoint', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}`,
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(200);
    });
  });

  describe('Validation & Errors', () => {
    it('should return 400 if bank parameter is missing', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('bank');
    });

    it('should return 400 if question parameter is missing', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}`,
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('question');
    });

    it('should return 404 if the bank ticker is not found', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          bank: 'NON_EXISTENT_TICKER',
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Bank not found');
    });

    it('should return the strict fallback response if data is missing or query cannot be answered', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}`,
          question: 'Please simulate MISSING_DATA',
        });
      expect(res.status).toBe(200);
      expect(res.body.answer).toBe('The requested information is unavailable in the current financial dataset.');
      expect(res.body.assumptions).toEqual([]);
      expect(res.body.metrics_used).toEqual([]);
    });
  });

  describe('Data Normalization', () => {
    it('should match the bank ticker even if suffix like .NS is appended', async () => {
      const res = await request
        .post(endpoint)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          bank: `TESTBANK_${RUN_ID}.NS`,
          question: 'What happens if NPA increases by 2%?',
        });
      expect(res.status).toBe(200);
      expect(res.body.answer).toContain('NIM is 4.2%');
      expect(res.body.metrics_used).toContain('NPA_percent');
    });
  });
});
