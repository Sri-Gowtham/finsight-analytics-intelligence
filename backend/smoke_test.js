import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { pool } from './src/config/db.js';

const BASE = 'http://localhost:3001';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function run() {
  console.log('=== FinSight API Smoke Tests ===\n');

  // 1. Forgot password (DB migration test)
  const fp = await req('POST', '/api/auth/forgot-password', { email: 'noone@test.com' });
  console.log(`[1] Forgot Password: ${fp.status === 200 && fp.data.success ? '✅ PASS' : '❌ FAIL'} (${fp.status})`);

  // 2. Generate token directly (real admin user)
  const { rows } = await pool.query("SELECT user_id, name, email, role FROM users WHERE role = 'Admin' AND is_active = true LIMIT 1");
  const adminUser = rows[0];
  const adminToken = jwt.sign({ user_id: adminUser.user_id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log(`[2] Admin Token Generated: ✅ PASS (${adminUser.email})`);

  // Get analyst token
  const { rows: analystRows } = await pool.query("SELECT user_id, role FROM users WHERE role = 'Analyst' AND is_active = true LIMIT 1");
  const analystToken = analystRows[0] ? jwt.sign({ user_id: analystRows[0].user_id, role: analystRows[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' }) : null;

  // 3. Test /api/portfolios (non-admin endpoint) as Admin
  const portfolios = await req('GET', '/api/portfolios', null, adminToken);
  console.log(`[3] GET /api/portfolios (Admin): ${portfolios.status === 200 && portfolios.data.portfolios ? `✅ PASS (${portfolios.data.portfolios.length} rows)` : `❌ FAIL (${portfolios.status}) ${JSON.stringify(portfolios.data).substring(0, 100)}`}`);

  // 4. Test PATCH /api/auth/profile
  const profile = await req('PATCH', '/api/auth/profile', { name: 'Admin User', job_title: 'Platform Admin', phone: '+91 99999 00001', department: 'Operations', location: 'Mumbai' }, adminToken);
  console.log(`[4] PATCH /api/auth/profile: ${profile.status === 200 && profile.data.success ? '✅ PASS' : `❌ FAIL (${profile.status}) ${JSON.stringify(profile.data).substring(0, 100)}`}`);

  // 5. Test admin clients list endpoint
  const clientList = await req('GET', '/api/admin/clients/list', null, adminToken);
  console.log(`[5] GET /api/admin/clients/list: ${clientList.status === 200 ? `✅ PASS (${clientList.data.clients?.length ?? 0} clients)` : `❌ FAIL (${clientList.status}) ${JSON.stringify(clientList.data).substring(0, 100)}`}`);

  // 6. Create a client
  const newClient = await req('POST', '/api/admin/clients', { name: 'Test Capital Ltd', type: 'Family Office', contact_name: 'Ravi Kumar', contact_email: 'ravi@testcap.com', contact_phone: '+91 98800 11122' }, adminToken);
  console.log(`[6] POST /api/admin/clients: ${newClient.status === 201 || newClient.status === 200 ? `✅ PASS` : `❌ FAIL (${newClient.status}) ${JSON.stringify(newClient.data).substring(0, 100)}`}`);

  // 7. SBI segment check
  const banks = await req('GET', '/api/companies', null, adminToken);
  const sbi = (banks.data.companies || []).find(c => c.ticker === 'SBIN');
  console.log(`[7] SBIN segment: ${sbi?.segment === 'Public' ? '✅ PASS (Public)' : `❌ FAIL (segment=${sbi?.segment}, sector=${sbi?.sector})`}`);

  // 8. Test Analyst GET /api/portfolios (the dashboard fix)
  if (analystToken) {
    const analystPortfolios = await req('GET', '/api/portfolios', null, analystToken);
    console.log(`[8] Analyst GET /api/portfolios: ${analystPortfolios.status === 200 ? `✅ PASS (${analystPortfolios.data.portfolios?.length ?? 0} rows)` : `❌ FAIL (${analystPortfolios.status})`}`);
  } else {
    console.log(`[8] Analyst GET /api/portfolios: ⚠️  SKIP (no analyst user)`);
  }

  // 9. Test password_reset_tokens table exists
  const tokenCheck = await pool.query('SELECT COUNT(*) FROM password_reset_tokens');
  console.log(`[9] password_reset_tokens table: ✅ EXISTS (${tokenCheck.rows[0].count} rows)`);

  // 10. Check profile columns on users
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('job_title','phone','department','location')`);
  console.log(`[10] users profile columns: ${cols.rows.length === 4 ? '✅ PASS (4 columns)' : `⚠️  Only ${cols.rows.length} columns found: ${cols.rows.map(r=>r.column_name).join(', ')}`}`);

  console.log('\n=== Done ===');
  await pool.end();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
