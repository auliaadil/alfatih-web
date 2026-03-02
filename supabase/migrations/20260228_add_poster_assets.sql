-- Create poster_assets table
CREATE TABLE IF NOT EXISTS public.poster_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('logo', 'sticker', 'background')),
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.poster_assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access to poster assets
CREATE POLICY "Allow public read access to poster assets" 
    ON public.poster_assets
    FOR SELECT 
    USING (true);

-- Allow authenticated users to manage poster assets
CREATE POLICY "Allow authenticated users to insert poster assets" 
    ON public.poster_assets
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update poster assets" 
    ON public.poster_assets
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete poster assets" 
    ON public.poster_assets
    FOR DELETE 
    USING (auth.role() = 'authenticated');
