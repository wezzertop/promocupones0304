
-- Create scraped_deals table
CREATE TABLE IF NOT EXISTS public.scraped_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('amazon', 'mercadolibre')),
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    currency TEXT DEFAULT 'MXN',
    image_url TEXT,
    url TEXT NOT NULL,
    description TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    raw_data JSONB,
    UNIQUE(source, external_id)
);

-- Create scraper_logs table
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation TEXT NOT NULL CHECK (operation IN ('search', 'url_scrape', 'publish')),
    source TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.scraped_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scraped_deals
-- Only admins and moderators can view and manage scraped deals
CREATE POLICY "Admins and moderators can view scraped deals"
    ON public.scraped_deals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can insert scraped deals"
    ON public.scraped_deals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can update scraped deals"
    ON public.scraped_deals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Create policies for scraper_logs
-- Only admins and moderators can view and insert logs
CREATE POLICY "Admins and moderators can view logs"
    ON public.scraper_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can insert logs"
    ON public.scraper_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'moderator')
        )
    );
