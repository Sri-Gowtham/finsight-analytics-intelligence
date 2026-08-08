import 'dotenv/config';
import { pool } from './src/config/db.js';

async function migrate() {
  console.log('🔧 Running FinSight DB migrations...\n');

  // 1. Check existing tables and columns
  console.log('📋 Checking existing schema...');
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('Existing tables:', tables.rows.map(r => r.table_name).join(', '));

  // Check companies columns  
  const companyCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'companies' ORDER BY ordinal_position
  `);
  console.log('\ncompanies columns:', companyCols.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));

  // Check users columns
  const userCols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' ORDER BY ordinal_position
  `);
  console.log('users columns:', userCols.rows.map(r => r.column_name).join(', '));

  // Check sample companies
  const companies = await pool.query(`SELECT company_id, name, ticker, sector, exchange FROM companies LIMIT 10`);
  console.log('\nSample companies:');
  companies.rows.forEach(r => console.log(`  ${r.ticker}: ${r.name} | sector=${r.sector} | exchange=${r.exchange}`));

  // Check client_portfolios
  try {
    const portfolios = await pool.query(`SELECT * FROM client_portfolios LIMIT 3`);
    console.log('\nclient_portfolios sample:', JSON.stringify(portfolios.rows[0] || null, null, 2));
    const portfolioCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'client_portfolios' ORDER BY ordinal_position
    `);
    console.log('client_portfolios columns:', portfolioCols.rows.map(r => r.column_name).join(', '));
  } catch(e) { console.log('client_portfolios error:', e.message); }

  // 2. MIGRATION: password_reset_tokens
  console.log('\n⚙️  Creating password_reset_tokens...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      email VARCHAR(150) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ password_reset_tokens ready');

  // 3. MIGRATION: clients table
  console.log('\n⚙️  Creating clients table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      type VARCHAR(50),
      contact_name VARCHAR(100),
      contact_email VARCHAR(150),
      contact_phone VARCHAR(30),
      assigned_analyst_id INT REFERENCES users(user_id),
      notes TEXT,
      stage VARCHAR(50) DEFAULT 'created',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ clients table ready');

  // 4. MIGRATION: client_files table
  console.log('\n⚙️  Creating client_files table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_files (
      id SERIAL PRIMARY KEY,
      client_id INT REFERENCES clients(id),
      filename VARCHAR(255),
      original_name VARCHAR(255),
      mimetype VARCHAR(100),
      size_bytes INT,
      uploaded_by INT REFERENCES users(user_id),
      uploaded_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ client_files table ready');

  // 5. MIGRATION: Add profile columns to users
  console.log('\n⚙️  Adding profile columns to users...');
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(100)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100)`);
  console.log('✅ users profile columns ready');

  // 6. SBI Classification fix - check which column holds sector type
  console.log('\n⚙️  Fixing SBI classification...');
  const sbiRow = await pool.query(`SELECT * FROM companies WHERE ticker = 'SBIN'`);
  if (sbiRow.rows.length > 0) {
    console.log('SBI row:', JSON.stringify(sbiRow.rows[0], null, 2));
    // Try updating sector column
    try {
      await pool.query(`UPDATE companies SET sector = 'Public' WHERE ticker = 'SBIN'`);
      console.log('✅ Updated companies.sector for SBIN to Public');
    } catch(e) {
      console.log('sector column update failed:', e.message);
    }
    // Also try type column
    try {
      await pool.query(`UPDATE companies SET type = 'Public' WHERE ticker = 'SBIN'`);
      console.log('✅ Updated companies.type for SBIN to Public');
    } catch(e) { /* column might not exist */ }
  } else {
    console.log('⚠️  SBIN not found in companies table');
  }

  // 7. Check if we have existing portfolio data
  console.log('\n📊 Checking portfolio data...');
  try {
    const pCount = await pool.query(`SELECT COUNT(*) as cnt FROM client_portfolios`);
    console.log(`client_portfolios count: ${pCount.rows[0].cnt}`);
  } catch(e) { console.log('client_portfolios:', e.message); }

  console.log('\n✅ All migrations complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
