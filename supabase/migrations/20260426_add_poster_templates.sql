CREATE TABLE IF NOT EXISTS public.poster_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    aspect_ratio VARCHAR(10) NOT NULL CHECK (aspect_ratio IN ('post', 'story')),
    template_type VARCHAR(30) NOT NULL DEFAULT 'custom',
    canvas_json JSONB NOT NULL,
    thumbnail_data_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read poster templates"
    ON public.poster_templates FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert poster templates"
    ON public.poster_templates FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update poster templates"
    ON public.poster_templates FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete poster templates"
    ON public.poster_templates FOR DELETE
    USING (auth.role() = 'authenticated');
