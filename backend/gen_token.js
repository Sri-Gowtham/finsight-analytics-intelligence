import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { pool } from './src/config/db.js';

// Get the first active admin user
const { rows } = await pool.query("SELECT user_id, name, email, role FROM users WHERE role = 'Admin' AND is_active = true LIMIT 1");
const user = rows[0];
if (!user) { console.log('No active admin found'); process.exit(1); }

const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(`Admin user: ${user.email} (user_id=${user.user_id})`);
console.log(`Token: ${token}`);
process.exit(0);
