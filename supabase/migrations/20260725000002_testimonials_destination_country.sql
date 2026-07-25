-- Testimonials table for configurable "What Our Pilgrims Say" section
CREATE TABLE IF NOT EXISTS testimonials (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  role        text        NOT NULL,
  comment     text        NOT NULL,
  avatar_url  text,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users manage testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Destination country for per-package country filtering on the packages listing page
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS destination_country text;
