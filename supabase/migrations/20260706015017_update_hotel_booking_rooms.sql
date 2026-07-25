-- Update hotel_bookings table to use a JSON array for rooms instead of singular room_type/paxes
alter table public.hotel_bookings
add column rooms jsonb default '[]'::jsonb;

-- Migrate existing data if any
update public.hotel_bookings
set rooms = jsonb_build_array(jsonb_build_object('room_type', room_type, 'paxes', paxes))
where room_type is not null or paxes is not null;

-- Drop old columns
alter table public.hotel_bookings
drop column room_type,
drop column paxes;
