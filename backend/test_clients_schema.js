import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  try {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients'`);
    console.table(res.rows);
    const chk = await pool.query(`SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'clients'::regclass`);
    console.table(chk.rows);
  } catch(e) { console.error(e); }
  finally { process.exit(0); }
}
run();
