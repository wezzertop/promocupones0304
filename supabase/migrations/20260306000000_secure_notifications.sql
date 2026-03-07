-- SECURE NOTIFICATIONS & AUTOMATE NEW DEAL ALERTS

-- 1. Create Trigger for NEW Deals (Insert)
CREATE OR REPLACE FUNCTION public.notify_new_deal()
RETURNS trigger AS $$
BEGIN
  -- Case 1: Created as Pending (Under Review)
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'system_alert',
      'Oferta en revisión',
      'Tu oferta "' || NEW.title || '" ha sido enviada y está siendo revisada por nuestro equipo.',
      '/mis-publicaciones'
    );
  END IF;

  -- Case 2: Created as Active (Auto-approved for admins/trusted)
  IF NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'post_approved',
      'Oferta publicada',
      'Tu oferta "' || NEW.title || '" ha sido publicada exitosamente.',
      '/oferta/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_deal ON deals;
CREATE TRIGGER trg_notify_new_deal
  AFTER INSERT ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_new_deal();


-- 2. Secure Notifications Table (Restrict INSERT)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;

CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );
