import 'dotenv/config';
import { pool } from './src/config/db.js';

const res = await pool.query('SELECT user_id, name, email, role, is_active FROM users ORDER BY user_id');
console.log('Users in DB:');
res.rows.forEach(r => console.log(`  ${r.user_id}: ${r.email} | role=${r.role} | active=${r.is_active}`));
process.exit(0);
