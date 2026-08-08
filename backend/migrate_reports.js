import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  try {
    await pool.query(`
      -- Add analyst assignment to portfolios
      ALTER TABLE client_portfolios 
        ADD COLUMN IF NOT EXISTS analyst_id INT 
        REFERENCES users(user_id);

      -- Client reports table
      CREATE TABLE IF NOT EXISTS client_reports (
        report_id SERIAL PRIMARY KEY,
        client_name VARCHAR(100) NOT NULL,
        analyst_id INT REFERENCES users(user_id) NOT NULL,
        analyst_notes TEXT NOT NULL,
        insight_ids TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' 
          CHECK (status IN ('pending','approved','rejected')),
        cfo_comment TEXT,
        reviewed_by INT REFERENCES users(user_id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    const tablesRes = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('client_reports','notifications','client_portfolios')
      ORDER BY table_name;
    `);
    console.log('--- TABLES ---');
    console.table(tablesRes.rows);

    const columnsRes = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'client_portfolios'
      ORDER BY ordinal_position;
    `);
    console.log('--- CLIENT_PORTFOLIOS COLUMNS ---');
    console.table(columnsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
runMigrations();
