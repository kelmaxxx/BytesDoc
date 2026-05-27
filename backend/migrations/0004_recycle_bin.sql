-- =============================================================================
-- Migration 0004: Recycle Bin
-- Adds soft-delete columns to documents and an auto-purge function.
-- Run this in Supabase SQL Editor.
-- =============================================================================

-- 1. Add soft-delete columns
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS is_deleted  boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz;

-- 2. Index so listing trashed docs is fast
CREATE INDEX IF NOT EXISTS documents_is_deleted_idx ON documents (is_deleted);

-- 3. Auto-purge function: permanently deletes rows trashed more than 30 days ago.
CREATE OR REPLACE FUNCTION purge_recycle_bin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM documents
  WHERE is_deleted = true
    AND deleted_at < now() - INTERVAL '30 days';
END;
$$;

-- 4. Schedule the purge to run daily at midnight UTC.
--    Requires the pg_cron extension — enable it in Supabase:
--    Dashboard → Database → Extensions → pg_cron → Enable
--    Then run this block once:
--
-- SELECT cron.schedule(
--   'purge-recycle-bin-daily',
--   '0 0 * * *',
--   $$ SELECT purge_recycle_bin(); $$
-- );

-- 5. RLS: trashed documents are invisible to normal queries.
DROP POLICY IF EXISTS documents_hide_deleted ON documents;
CREATE POLICY documents_hide_deleted
  ON documents
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);
