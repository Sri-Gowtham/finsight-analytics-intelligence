import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const hash = await bcrypt.hash('demo1234', 4);
for (const email of ['admin@finsight.demo','analyst@finsight.demo','cfo@finsight.demo']) {
  const r = await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, role', [hash, email]);
  console.log(r.rows.length ? 'Reset: ' + r.rows[0].email + ' (' + r.rows[0].role + ')' : 'Not found: ' + email);
}
await pool.end();
