-- New: airports table
CREATE TABLE IF NOT EXISTS airports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code  TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  country    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed common Umrah-route airports
INSERT INTO airports (iata_code, name, city, country) VALUES
  ('CGK', 'Soekarno-Hatta International', 'Jakarta', 'Indonesia'),
  ('SUB', 'Juanda International', 'Surabaya', 'Indonesia'),
  ('KNO', 'Kualanamu International', 'Medan', 'Indonesia'),
  ('JED', 'King Abdulaziz International', 'Jeddah', 'Saudi Arabia'),
  ('MED', 'Prince Mohammad bin Abdulaziz International Airport', 'Madinah', 'Saudi Arabia'),
  ('IST', 'Istanbul Airport', 'Istanbul', 'Turkey'),
  ('DXB', 'Dubai International', 'Dubai', 'UAE'),
  ('DOH', 'Hamad International', 'Doha', 'Qatar')
ON CONFLICT (iata_code) DO NOTHING;

-- New: categories table
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial categories
INSERT INTO categories (name, slug) VALUES
  ('Umrah', 'umrah'),
  ('Asia', 'asia'),
  ('Europe', 'europe'),
  ('Middle East', 'middle-east')
ON CONFLICT (name) DO NOTHING;

-- Add room_types to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS room_types JSONB DEFAULT '[]'::jsonb;

-- Update packages schema
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS arrival_date  DATE,
  ADD COLUMN IF NOT EXISTS flight_routes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_credit  TEXT;

-- Remove obsolete columns
ALTER TABLE packages
  DROP COLUMN IF EXISTS initial_rooms,
  DROP COLUMN IF EXISTS available_rooms,
  DROP COLUMN IF EXISTS flight_details;

-- RLS: airports
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "airports_public_read" ON airports;
DROP POLICY IF EXISTS "airports_auth_write" ON airports;
-- Note: 'authenticated' allows any Supabase user; acceptable while there are no public sign-ups
CREATE POLICY "airports_public_read"  ON airports FOR SELECT USING (true);
CREATE POLICY "airports_auth_write"   ON airports FOR ALL USING (auth.role() = 'authenticated');

-- RLS: categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_auth_write" ON categories;
-- Note: same accepted tradeoff as airports_auth_write
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_auth_write"  ON categories FOR ALL USING (auth.role() = 'authenticated');
