
-- RESTORE MODERATION TRIGGER

-- 1. Recreate the function to enforce deal status
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
         NEW.status := 'pending';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger
DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;
CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();
