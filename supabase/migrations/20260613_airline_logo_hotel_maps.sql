-- Add Google Maps URL to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS maps_url TEXT DEFAULT NULL;
