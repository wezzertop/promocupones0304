-- SECURITY HARDENING MIGRATION
-- 1. Prevent Privilege Escalation (Users changing their own role)
-- 2. Enforce Deal Status (Prevent bypassing moderation)

-- 1. PREVENT ROLE CHANGES
-- Create a trigger to prevent non-admins from changing their role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the user is an admin (we need to query the table itself or rely on auth.jwt() claims if role was there, but here role is in the table)
    -- However, inside a trigger, we can't easily check the *requesting* user's role if it's the same table being updated, unless we trust the OLD.role.
    -- But if I am an admin, I can change others' roles.
    -- If I am a user, I should not be able to change my role.
    
    -- Better approach: Check auth.uid()
    -- If the user is updating their own record (auth.uid() = id), they cannot change role.
    -- Admins updating other users (auth.uid() != id) is allowed (assuming RLS allows it).
    
    IF auth.uid() = NEW.id THEN
       -- User updating themselves
       IF NEW.role != OLD.role THEN
           RAISE EXCEPTION 'You cannot change your own role.';
       END IF;
    END IF;
    
    -- What if an admin wants to demote themselves? Maybe allow that? 
    -- For now, strict: No self-promotion.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_change();


-- 2. ENFORCE DEAL STATUS
-- Create a trigger to force status to 'pending' for non-admins
CREATE OR REPLACE FUNCTION public.enforce_deal_status()
RETURNS trigger AS $$
DECLARE
  is_staff BOOLEAN;
BEGIN
  -- Check if the current user is admin or moderator
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) INTO is_staff;

  -- If not staff, force status to pending on INSERT
  IF NOT is_staff THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'pending';
      NEW.moderated_by := NULL;
      NEW.moderated_at := NULL;
      NEW.moderation_notes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      -- If updating critical fields, reset to pending?
      -- Let's say if title, description, url, price, image changes.
      -- For now, let's just prevent them from setting 'active' if it was 'pending' or 'rejected'.
      
      -- If they try to set status to 'active', block it or revert it.
      IF NEW.status = 'active' AND OLD.status != 'active' THEN
         NEW.status := 'pending'; -- Or keep OLD.status? Pending is safer.
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
