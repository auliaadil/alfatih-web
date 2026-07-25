-- packages: publish toggle (default true keeps existing packages visible)
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- packages: persist generated itinerary PDF URL
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS itinerary_pdf_url text;

-- categories: terms & conditions per category
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS terms_conditions text;

-- order receipts: multi-file attachment table (same pattern as booking_attachments)
CREATE TABLE IF NOT EXISTS order_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_url    text        NOT NULL,
  file_name   text        NOT NULL,
  file_type   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage order_attachments"
  ON order_attachments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
