import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function init() {
  console.log('--- Initializing FinSight Database Schema ---');
  await pool.query('BEGIN');
  try {
    // 1. users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Analyst', 'CFO', 'Admin')),
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // 2. companies
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ticker VARCHAR(50) UNIQUE NOT NULL,
        exchange VARCHAR(50) DEFAULT 'NSE',
        sector VARCHAR(100) DEFAULT 'Banking'
      );
    `);

    // 3. financial_metrics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_metrics (
        metric_id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        value DECIMAL(20,4) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. insights
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insights (
        insight_id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        generated_text TEXT NOT NULL,
        insight_type VARCHAR(100),
        source_metric_ids VARCHAR(255),
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. client_portfolios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_portfolios (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        uploaded_by INT REFERENCES users(user_id) ON DELETE SET NULL
      );
    `);

    // 6. whatif_scenarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatif_scenarios (
        scenario_id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        analyst_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        metric_name VARCHAR(100) NOT NULL,
        current_value DECIMAL(20,4),
        hypothetical_value DECIMAL(20,4),
        estimated_output TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully.');

    // Seed Demo Users
    const hash = await bcrypt.hash('demo1234', 4);
    const demoUsers = [
      { name: 'Demo Admin', email: 'admin@finsight.demo', role: 'Admin' },
      { name: 'Demo Analyst', email: 'analyst@finsight.demo', role: 'Analyst' },
      { name: 'Demo CFO', email: 'cfo@finsight.demo', role: 'CFO' },
    ];

    for (const u of demoUsers) {
      await pool.query(`
        INSERT INTO users (name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true;
      `, [u.name, u.email, hash, u.role]);
    }
    console.log('Demo users seeded.');

    // Seed 5 NSE Banks
    const banks = [
      { id: 1, name: 'HDFC Bank', ticker: 'HDFCBANK' },
      { id: 2, name: 'ICICI Bank', ticker: 'ICICIBANK' },
      { id: 3, name: 'State Bank of India', ticker: 'SBIN' },
      { id: 4, name: 'Axis Bank', ticker: 'AXISBANK' },
      { id: 5, name: 'Kotak Mahindra Bank', ticker: 'KOTAKBANK' }
    ];

    for (const b of banks) {
      await pool.query(`
        INSERT INTO companies (company_id, name, ticker, exchange, sector)
        VALUES ($1, $2, $3, 'NSE', 'Banking')
        ON CONFLICT (ticker) DO UPDATE SET name = EXCLUDED.name;
      `, [b.id, b.name, b.ticker]);
    }
    await pool.query(`SELECT setval('companies_company_id_seq', (SELECT MAX(company_id) FROM companies));`);
    console.log('5 NSE banks seeded.');

    await pool.query('COMMIT');
    console.log('Schema initialization complete.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Failed to init schema:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

init();
