import pg from 'pg';

const { Pool } = pg;

/**
 * Central connection pool.
 * Uses DATABASE_URL from the environment (set via .env locally,
 * or via Render/Railway dashboard in production).
 *
 * ssl.rejectUnauthorized is disabled for managed cloud databases
 * that use self-signed certificates (Render, Railway, Supabase, etc.).
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});