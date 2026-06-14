-- Default room types for hotels: Quad (4), Triple (3), Double (2)
-- Populate every existing hotel with these room types.
UPDATE hotels
SET room_types = '[
  {"name": "Quad", "capacity": 4},
  {"name": "Triple", "capacity": 3},
  {"name": "Double", "capacity": 2}
]'::jsonb;

-- New hotels default to the same room type config.
ALTER TABLE hotels
  ALTER COLUMN room_types SET DEFAULT '[
  {"name": "Quad", "capacity": 4},
  {"name": "Triple", "capacity": 3},
  {"name": "Double", "capacity": 2}
]'::jsonb;
