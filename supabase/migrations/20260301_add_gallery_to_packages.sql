ALTER TABLE packages ADD COLUMN IF NOT EXISTS gallery text[] DEFAULT '{}';
