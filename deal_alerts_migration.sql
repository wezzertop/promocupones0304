-- SCRIPTS PARA CREAR LA TABLA DE ALERTAS Y TRIGGERS (EJECUTAR EN SUPABASE SQL EDITOR)

-- 1. Tabla de alertas
CREATE TABLE IF NOT EXISTS public.deal_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    max_price NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS (Row Level Security)
ALTER TABLE public.deal_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" 
ON public.deal_alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" 
ON public.deal_alerts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.deal_alerts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" 
ON public.deal_alerts FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Función y Trigger para notificar automáticamente
CREATE OR REPLACE FUNCTION public.check_deal_alerts_on_insert()
RETURNS trigger AS $$
DECLARE
    alert_record RECORD;
BEGIN
    -- Solo verificar ofertas que estén activas
    IF NEW.status = 'active' THEN
        FOR alert_record IN 
            SELECT * FROM public.deal_alerts 
            WHERE is_active = true
            AND ( NEW.title ILIKE '%' || keyword || '%' 
                  OR NEW.description ILIKE '%' || keyword || '%' )
            AND ( max_price IS NULL OR NEW.deal_price <= max_price )
        LOOP
            -- Solo notificar si el autor de la oferta no es el mismo que creó la alerta
            IF NEW.user_id != alert_record.user_id THEN
                -- Insertar la notificación
                INSERT INTO public.notifications (user_id, type, title, message, link, is_read)
                VALUES (
                    alert_record.user_id,
                    'deal_alert',
                    '¡Alerta de oferta: ' || alert_record.keyword || '!',
                    NEW.title,
                    '/oferta/' || NEW.id,
                    false
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe, para poder re-ejecutar sin problemas
DROP TRIGGER IF EXISTS on_deal_created_check_alerts ON public.deals;

CREATE TRIGGER on_deal_created_check_alerts
    AFTER INSERT ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION public.check_deal_alerts_on_insert();
