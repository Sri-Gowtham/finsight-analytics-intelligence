/**
 * Global test setup — runs once before the entire suite.
 * Ensures the base tables exist and applies all schema migrations idempotently.
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

  // ── Base schema (idempotent) ─────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id    SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      role       VARCHAR(50)  NOT NULL CHECK (role IN ('Analyst', 'CFO', 'Admin')),
      password_hash TEXT NOT NULL
    );
  `);

  // ── Migration 002 — CFO approval workflow + user active flag ────────────
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);

  await pool.query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20) DEFAULT 'pending'`);
  await pool.query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMP`);
  await pool.query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMP`);
  await pool.query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
  await pool.query(`ALTER TABLE insights ADD COLUMN IF NOT EXISTS reviewed_by      INT REFERENCES users(user_id)`);

  await pool.end();
}
