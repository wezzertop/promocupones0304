-- FIX SQL FOR MANUAL EXECUTION
-- Copy this content and run it in the Supabase Dashboard SQL Editor

-- 1. PREVENT ROLE CHANGES
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() = NEW.id THEN
       IF NEW.role != OLD.role THEN
           RAISE EXCEPTION 'You cannot change your own role.';
       END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_change();


-- 2. ENFORCE DEAL STATUS
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

DROP TRIGGER IF EXISTS trg_enforce_deal_status ON deals;
CREATE TRIGGER trg_enforce_deal_status
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deal_status();
