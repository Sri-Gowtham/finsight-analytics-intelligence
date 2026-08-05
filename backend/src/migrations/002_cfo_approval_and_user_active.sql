-- Migration 002: CFO approval workflow + user active flag
-- Run once against the production/dev database.
-- All ALTERs are idempotent via IF NOT EXISTS / DO $$ checks.

-- ── users.is_active ────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ── insights: approval workflow columns ────────────────────────────────────
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS approval_status  VARCHAR(20) DEFAULT 'pending';
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMP;
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMP;
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS reviewed_by      INT REFERENCES users(user_id);
