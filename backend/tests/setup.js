/**
 * Global test setup — runs once before the entire suite.
 * Ensures the "users" table exists (idempotent) so tests
 * can run against a fresh or existing database.
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export default async function globalSetup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id    SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      role       VARCHAR(50)  NOT NULL CHECK (role IN ('Analyst', 'CFO', 'Admin')),
      password_hash TEXT NOT NULL
    );
  `);

  await pool.end();
}
