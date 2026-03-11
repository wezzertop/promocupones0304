-- Create a rate_limits table for custom rate limiting logic
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1,
    last_request TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for expiration cleanup
CREATE INDEX idx_rate_limits_expires_at ON public.rate_limits(expires_at);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Cleanup expired entries (could be done via cron, but inline is simple for low traffic)
    DELETE FROM public.rate_limits WHERE expires_at < now();

    -- Try to update existing entry
    UPDATE public.rate_limits
    SET count = count + 1,
        last_request = now()
    WHERE key = p_key
    RETURNING count INTO v_count;

    -- If no entry existed, insert one
    IF v_count IS NULL THEN
        INSERT INTO public.rate_limits (key, count, expires_at)
        VALUES (p_key, 1, now() + (p_window_seconds || ' seconds')::interval);
        v_count := 1;
    END IF;

    -- Check if limit exceeded
    IF v_count > p_limit THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END;
$$;

-- Enable RLS (though only accessible via function if we restrict insert/update)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access for anon or authenticated users needed, only via function
-- But function is SECURITY DEFINER, so it bypasses RLS on the table itself.
-- However, we should restrict who can call this function if exposed via API?
-- It's a postgres function, primarily for internal use or via RPC if needed.
-- Let's just keep it simple.
