-- Feature 06: Add expiry/freshness columns to needs table
-- Applied manually via psql (drizzle-kit hangs on Windows)

ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS expires_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
