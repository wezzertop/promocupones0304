-- 1. Asegurar que la tabla votes existe
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deal_id)
);

-- 2. Habilitar RLS en votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad para votes
-- Eliminar políticas existentes para evitar conflictos si ya existen
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;

CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON public.votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON public.votes
    FOR SELECT USING (true);

-- 4. Agregar columna votes_count a deals si no existe
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;

-- 5. Función para actualizar el conteo de votos
CREATE OR REPLACE FUNCTION public.handle_vote_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso: Insertar nuevo voto
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count + 1 WHERE id = NEW.deal_id;
        ELSIF (NEW.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count - 1 WHERE id = NEW.deal_id;
        END IF;
        RETURN NEW;
    
    -- Caso: Borrar voto existente
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count - 1 WHERE id = OLD.deal_id;
        ELSIF (OLD.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count + 1 WHERE id = OLD.deal_id;
        END IF;
        RETURN OLD;

    -- Caso: Cambiar voto (Update)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Si cambia de hot a cold: -1 (quitar hot) -1 (poner cold) = -2
        IF (OLD.vote_type = 'hot' AND NEW.vote_type = 'cold') THEN
            UPDATE public.deals SET votes_count = votes_count - 2 WHERE id = NEW.deal_id;
        -- Si cambia de cold a hot: +1 (quitar cold) +1 (poner hot) = +2
        ELSIF (OLD.vote_type = 'cold' AND NEW.vote_type = 'hot') THEN
            UPDATE public.deals SET votes_count = votes_count + 2 WHERE id = NEW.deal_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para ejecutar la función
DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE PROCEDURE public.handle_vote_update();

-- 7. Grant permissions
GRANT ALL ON public.votes TO authenticated;
GRANT SELECT ON public.votes TO anon;
