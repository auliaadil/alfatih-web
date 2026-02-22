-- Add the slug column
ALTER TABLE packages ADD COLUMN IF NOT EXISTS slug text;

-- Temporarily, let's not make it UNIQUE until we backfill
-- After we run the TS script to backfill, we should run:
-- ALTER TABLE packages ADD CONSTRAINT packages_slug_key UNIQUE (slug);
