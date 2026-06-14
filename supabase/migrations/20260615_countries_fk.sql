-- ============================================================
-- 1. countries reference table
-- ============================================================
CREATE TABLE countries (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

INSERT INTO countries (name) VALUES
  ('Indonesia'),
  ('Saudi Arabia'),
  ('UAE'),
  ('Qatar'),
  ('Turkey'),
  ('Oman'),
  ('Jordan'),
  ('Egypt'),
  ('Malaysia'),
  ('Singapore'),
  ('Thailand')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_public_read" ON countries FOR SELECT USING (true);
CREATE POLICY "countries_auth_write"  ON countries FOR ALL   USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. airlines — add country_id FK (nullable, no existing rows)
-- ============================================================
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

-- ============================================================
-- 3. hotels — add country_id FK (nullable, no existing rows)
-- ============================================================
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

-- ============================================================
-- 4. airports — migrate country TEXT → country_id FK
-- ============================================================
ALTER TABLE airports ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);

UPDATE airports
SET country_id = (SELECT id FROM countries WHERE name = airports.country);

ALTER TABLE airports ALTER COLUMN country_id SET NOT NULL;
ALTER TABLE airports DROP COLUMN IF EXISTS country;

-- ============================================================
-- 5. Seed airlines (15 records)
-- ============================================================
INSERT INTO airlines (name, country_id) VALUES
  ('Garuda Indonesia',   (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Lion Air',           (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Batik Air',          (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Citilink',           (SELECT id FROM countries WHERE name = 'Indonesia')),
  ('Saudia',             (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('flynas',             (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Emirates',           (SELECT id FROM countries WHERE name = 'UAE')),
  ('Air Arabia',         (SELECT id FROM countries WHERE name = 'UAE')),
  ('Etihad Airways',     (SELECT id FROM countries WHERE name = 'UAE')),
  ('Qatar Airways',      (SELECT id FROM countries WHERE name = 'Qatar')),
  ('Turkish Airlines',   (SELECT id FROM countries WHERE name = 'Turkey')),
  ('Oman Air',           (SELECT id FROM countries WHERE name = 'Oman')),
  ('Malaysia Airlines',  (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('AirAsia',            (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('Singapore Airlines', (SELECT id FROM countries WHERE name = 'Singapore'));

-- ============================================================
-- 6. Seed hotels (16 records)
-- ============================================================
INSERT INTO hotels (name, location, stars, room_types, country_id) VALUES
  ('Dar Al Tawhid Intercontinental', 'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Anjum Hotel Makkah',             'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Pullman ZamZam Makkah',          'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Swissotel Al Maqam Makkah',      'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Hilton Suites Makkah',           'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Le Meridien Towers Makkah',      'Makkah',   5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Royal Dar Al Hijra',             'Makkah',   4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Al Safwah Royale Orchid',        'Makkah',   4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Anwar Al Madinah Mövenpick',     'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Dar Al Iman InterContinental',   'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Oberoi Madinah',                 'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Hilton Madinah',                 'Madinah',  5, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('Al Shohada Hotel',               'Madinah',  4, '[]', (SELECT id FROM countries WHERE name = 'Saudi Arabia')),
  ('JW Marriott Hotel Dubai',        'Dubai',    5, '[]', (SELECT id FROM countries WHERE name = 'UAE')),
  ('Kempinski Mall of the Emirates', 'Dubai',    5, '[]', (SELECT id FROM countries WHERE name = 'UAE')),
  ('Conrad Istanbul Bosphorus',      'Istanbul', 5, '[]', (SELECT id FROM countries WHERE name = 'Turkey'));

-- ============================================================
-- 7. Seed additional airports (6 records)
-- ============================================================
INSERT INTO airports (iata_code, name, city, country_id) VALUES
  ('AUH', 'Abu Dhabi International',    'Abu Dhabi',    (SELECT id FROM countries WHERE name = 'UAE')),
  ('AMM', 'Queen Alia International',   'Amman',        (SELECT id FROM countries WHERE name = 'Jordan')),
  ('CAI', 'Cairo International',        'Cairo',        (SELECT id FROM countries WHERE name = 'Egypt')),
  ('KUL', 'Kuala Lumpur International', 'Kuala Lumpur', (SELECT id FROM countries WHERE name = 'Malaysia')),
  ('SIN', 'Changi International',       'Singapore',    (SELECT id FROM countries WHERE name = 'Singapore')),
  ('BKK', 'Suvarnabhumi International', 'Bangkok',      (SELECT id FROM countries WHERE name = 'Thailand'))
ON CONFLICT (iata_code) DO NOTHING;
