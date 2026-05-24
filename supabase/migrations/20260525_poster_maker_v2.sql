-- supabase/migrations/20260525_poster_maker_v2.sql

-- Make canvas_json nullable (old Fabric.js data is archived, new block-based templates have NULL here)
ALTER TABLE public.poster_templates
  ALTER COLUMN canvas_json DROP NOT NULL;

-- Add columns for block-based templates
ALTER TABLE public.poster_templates
  ADD COLUMN IF NOT EXISTS blocks JSONB,
  ADD COLUMN IF NOT EXISTS field_schema JSONB,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS starter_id TEXT;
