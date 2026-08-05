import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Creating tables if not exist...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Analyst', 'CFO', 'Admin')),
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ticker VARCHAR(50) UNIQUE NOT NULL,
        exchange VARCHAR(50),
        sector VARCHAR(100)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_metrics (
        id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        value DECIMAL(20,4) NOT NULL,
        timestamp VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS insights (
        insight_id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        generated_text TEXT NOT NULL,
        insight_type VARCHAR(100),
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        reviewed_by INT REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query('ALTER TABLE insights ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()');
    await client.query('UPDATE insights SET created_at = NOW() WHERE created_at IS NULL');

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_portfolios (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        uploaded_by INT REFERENCES users(user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS whatif_scenarios (
        scenario_id SERIAL PRIMARY KEY,
        company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
        analyst_id INT REFERENCES users(user_id),
        metric_name VARCHAR(100),
        current_value DECIMAL(20,4),
        hypothetical_value DECIMAL(20,4),
        estimated_output TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully.');

    console.log('Seeding demo users...');
    const hash = await bcrypt.hash('demo1234', 4);
    const users = [
      { name: 'Admin User', email: 'admin@finsight.demo', role: 'Admin' },
      { name: 'Analyst User', email: 'analyst@finsight.demo', role: 'Analyst' },
      { name: 'CFO User', email: 'cfo@finsight.demo', role: 'CFO' }
    ];
    for (const u of users) {
      await client.query(`
        INSERT INTO users (name, email, role, password_hash, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (email) DO UPDATE SET password_hash = $4, is_active = true
      `, [u.name, u.email, u.role, hash]);
    }

    console.log('Seeding demo companies...');
    const banks = [
      { id: 1, name: 'HDFC Bank', ticker: 'HDFCBANK', exchange: 'NSE', sector: 'Banking' },
      { id: 2, name: 'ICICI Bank', ticker: 'ICICIBANK', exchange: 'NSE', sector: 'Banking' },
      { id: 3, name: 'State Bank of India', ticker: 'SBIN', exchange: 'NSE', sector: 'Banking' },
      { id: 4, name: 'Axis Bank', ticker: 'AXISBANK', exchange: 'NSE', sector: 'Banking' },
      { id: 5, name: 'Kotak Mahindra Bank', ticker: 'KOTAKBANK', exchange: 'NSE', sector: 'Banking' }
    ];
    for (const b of banks) {
      await client.query(`
        INSERT INTO companies (company_id, name, ticker, exchange, sector)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (ticker) DO UPDATE SET name = $2, exchange = $4, sector = $5
      `, [b.id, b.name, b.ticker, b.exchange, b.sector]);
    }
    // Ensure company_id seq is up to date
    await client.query("SELECT setval('companies_company_id_seq', (SELECT MAX(company_id) FROM companies))");

    console.log('Seeding client portfolios...');
    await client.query('DELETE FROM client_portfolios');
    for (const b of banks) {
      await client.query(`
        INSERT INTO client_portfolios (client_name, company_id, uploaded_by)
        VALUES ($1, $2, (SELECT user_id FROM users WHERE role = 'Admin' LIMIT 1))
      `, ['Alpha Capital Portfolio', b.id]);
    }

    await client.query('COMMIT');
    console.log('Database setup complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error during database setup:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
