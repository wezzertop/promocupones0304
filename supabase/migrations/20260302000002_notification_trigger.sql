
-- TRIGGER FOR DEAL STATUS NOTIFICATIONS

CREATE OR REPLACE FUNCTION public.notify_deal_status_change()
RETURNS trigger AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Case 1: Pending -> Active (Approved)
    IF OLD.status = 'pending' AND NEW.status = 'active' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'post_approved',
        '¡Tu oferta ha sido aprobada!',
        'Tu publicación "' || NEW.title || '" ya está visible para toda la comunidad.',
        '/oferta/' || NEW.id
      );
    END IF;

    -- Case 2: Pending -> Rejected
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'post_rejected',
        'Tu oferta ha sido rechazada',
        'Tu publicación "' || NEW.title || '" no cumple con nuestras normas. Revisa el motivo en tus publicaciones.',
        '/mis-publicaciones'
      );
    END IF;

    -- Case 3: Active -> Expired (Optional, maybe too noisy?)
    -- IF NEW.status = 'expired' THEN ... END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_deal_status_change ON deals;
CREATE TRIGGER trg_notify_deal_status_change
  AFTER UPDATE ON deals
  FOR EACH ROW EXECUTE PROCEDURE public.notify_deal_status_change();
