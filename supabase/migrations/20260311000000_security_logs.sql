-- Create security_logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'mfa_enroll', 'suspicious_activity'
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can view all logs
CREATE POLICY "Admins can view all security logs"
    ON public.security_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Users can view their own logs
CREATE POLICY "Users can view their own security logs"
    ON public.security_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- System/Server can insert logs (using service role or authenticated user)
-- Ideally, we want a function to insert logs securely.
-- For now, allow authenticated users to insert their own logs (e.g., "I just logged in") 
-- BUT this can be spoofed. Better to use a secure function.
-- However, for simplicity in this architecture without Edge Functions for everything, 
-- we'll allow insert for authenticated users for their own records, 
-- but realistically this should be done via a Postgres Function called by the server.

CREATE POLICY "Users can insert their own security logs"
    ON public.security_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);

-- Function to log security event
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (usually admin/postgres)
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.security_logs (user_id, event_type, ip_address, user_agent, details)
    VALUES (p_user_id, p_event_type, p_ip_address, p_user_agent, p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;
