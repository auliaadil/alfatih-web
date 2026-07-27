-- Many-to-many: packages ↔ countries
CREATE TABLE IF NOT EXISTS package_countries (
  package_id  uuid NOT NULL REFERENCES packages(id)  ON DELETE CASCADE,
  country_id  uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, country_id)
);

ALTER TABLE package_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view package_countries"
  ON package_countries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users manage package_countries"
  ON package_countries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
