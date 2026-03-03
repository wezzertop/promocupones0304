
-- 1. Asegurar que el estado por defecto sea 'pending'
ALTER TABLE deals ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Función para forzar el estado a pending si no es admin/moderador
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  -- Verificar si es admin o moderador consultando la tabla pública de usuarios
  -- Asumimos que auth.uid() coincide con users.id
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  -- Si NO es staff, forzamos reglas de moderación
  IF NOT is_staff OR is_staff IS NULL THEN
    
    IF TG_OP = 'INSERT' THEN
      -- Al crear, siempre pending
      NEW.status := 'pending';
      -- Limpiar campos de moderación por si acaso
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    
    ELSIF TG_OP = 'UPDATE' THEN
      -- Al actualizar:
      -- 1. Si intenta cambiar status a active/rejected -> forzar pending
      IF NEW.status IN ('active', 'rejected') AND OLD.status != NEW.status THEN
         NEW.status := 'pending';
      END IF;
      
      -- 2. Si edita campos sensibles de una oferta activa -> volver a pending
      -- (Opcional: descomentar si se desea re-moderación estricta en edición)
      -- IF OLD.status = 'active' AND (
      --    NEW.title != OLD.title OR 
      --    NEW.deal_price != OLD.deal_price OR
      --    NEW.deal_url != OLD.deal_url
      -- ) THEN
      --    NEW.status := 'pending';
      -- END IF;
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;

CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();
