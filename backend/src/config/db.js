import pg from 'pg';

const { Pool } = pg;

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '');

/**
 * Central connection pool.
 * Uses DATABASE_URL from the environment (set via .env locally,
 * or via Render/Railway dashboard in production).
 *
 * SSL is skipped for a local Postgres. For managed cloud databases,
 * ssl.rejectUnauthorized is disabled because they use self-signed certificates
 * (Render, Railway, Supabase, etc.).
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
