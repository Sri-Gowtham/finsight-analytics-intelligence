import 'dotenv/config';
import app from './src/app.js';
import { pool } from './src/config/db.js';

const PORT = process.env.PORT || 3001;

// Verify DB connectivity on startup, but don't crash — the health route
// will report the real status and Render/Railway will restart if needed.
try {
  const { rows } = await pool.query('SELECT NOW()');
  console.log(`✓ PostgreSQL connected — server time ${rows[0].now}`);
} catch (err) {
  console.error('✗ PostgreSQL connection failed:', err.message);
}

app.listen(PORT, () => {
  console.log(`✓ FinSight API listening on port ${PORT}`);
});
