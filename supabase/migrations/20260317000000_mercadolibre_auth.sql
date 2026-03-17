-- Create table to store Mercado Libre OAuth tokens
CREATE TABLE IF NOT EXISTS public.mercadolibre_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure only one active token configuration exists (optional, but good for global auth)
CREATE UNIQUE INDEX IF NOT EXISTS mercadolibre_auth_single_row_idx ON public.mercadolibre_auth ((true));

-- Enable Row Level Security
ALTER TABLE public.mercadolibre_auth ENABLE ROW LEVEL SECURITY;

-- Deny all access by default (accessed only via service role)
CREATE POLICY "Deny all public access to mercadolibre_auth" 
    ON public.mercadolibre_auth 
    FOR ALL 
    TO public 
    USING (false);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_mercadolibre_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mercadolibre_auth_updated_at_trigger ON public.mercadolibre_auth;
CREATE TRIGGER update_mercadolibre_auth_updated_at_trigger
    BEFORE UPDATE ON public.mercadolibre_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_mercadolibre_auth_updated_at();
