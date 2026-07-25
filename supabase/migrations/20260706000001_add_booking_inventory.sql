-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    contact_info TEXT,
    agent_type TEXT DEFAULT 'Person' CHECK (agent_type IN ('Person', 'OTA', 'Direct')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Policies for agents
CREATE POLICY "Enable read access for authenticated users" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.agents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.agents FOR DELETE TO authenticated USING (true);

-- Create hotel_bookings table
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE RESTRICT,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    check_in_date DATE,
    check_out_date DATE,
    room_type TEXT,
    paxes INTEGER,
    price NUMERIC,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'Planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for hotel_bookings
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for hotel_bookings
CREATE POLICY "Enable read access for authenticated users" ON public.hotel_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.hotel_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.hotel_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.hotel_bookings FOR DELETE TO authenticated USING (true);

-- Create flight_bookings table
CREATE TABLE IF NOT EXISTS public.flight_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    airline_id UUID REFERENCES public.airlines(id) ON DELETE RESTRICT,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    departure_date DATE,
    return_date DATE,
    flight_route TEXT,
    paxes INTEGER,
    price NUMERIC,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'Planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for flight_bookings
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for flight_bookings
CREATE POLICY "Enable read access for authenticated users" ON public.flight_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.flight_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.flight_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.flight_bookings FOR DELETE TO authenticated USING (true);

-- Create booking_attachments table
CREATE TABLE IF NOT EXISTS public.booking_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_booking_id UUID REFERENCES public.hotel_bookings(id) ON DELETE CASCADE,
    flight_booking_id UUID REFERENCES public.flight_bookings(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_booking_linked CHECK (hotel_booking_id IS NOT NULL OR flight_booking_id IS NOT NULL)
);

-- Enable RLS for booking_attachments
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for booking_attachments
CREATE POLICY "Enable read access for authenticated users" ON public.booking_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.booking_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.booking_attachments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.booking_attachments FOR DELETE TO authenticated USING (true);

-- Setup Storage Bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-receipts', 'booking-receipts', false) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for booking-receipts bucket (Admin access only)
CREATE POLICY "Enable authenticated read access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'booking-receipts');
CREATE POLICY "Enable authenticated insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'booking-receipts');
CREATE POLICY "Enable authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'booking-receipts');
