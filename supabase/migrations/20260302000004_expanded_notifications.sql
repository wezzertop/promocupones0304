-- Notifications System Expansion

-- 1. Notify on Comment Reply
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS trigger AS $$
DECLARE
  v_parent_author_id UUID;
  v_deal_title TEXT;
  v_deal_id UUID;
BEGIN
  -- Check if it is a reply
  IF NEW.parent_id IS NOT NULL THEN
    -- Get parent comment author
    SELECT user_id INTO v_parent_author_id
    FROM comments
    WHERE id = NEW.parent_id;

    -- Get deal info
    SELECT title, id INTO v_deal_title, v_deal_id
    FROM deals
    WHERE id = NEW.deal_id;

    -- Notify only if not replying to self
    IF v_parent_author_id IS DISTINCT FROM NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        v_parent_author_id,
        'comment_reply',
        'Alguien respondió a tu comentario',
        'Han respondido a tu comentario en "' || v_deal_title || '"',
        '/oferta/' || v_deal_id || '#comment-' || NEW.id
      );
    END IF;
  ELSE
    -- Optional: Notify deal author of new top-level comment (if not self)
    DECLARE
        v_deal_author_id UUID;
    BEGIN
        SELECT user_id, title INTO v_deal_author_id, v_deal_title
        FROM deals
        WHERE id = NEW.deal_id;
        
        IF v_deal_author_id IS DISTINCT FROM NEW.user_id THEN
             INSERT INTO public.notifications (user_id, type, title, message, link)
              VALUES (
                v_deal_author_id,
                'new_comment',
                'Nuevo comentario en tu oferta',
                'Alguien comentó en "' || v_deal_title || '"',
                '/oferta/' || NEW.deal_id || '#comment-' || NEW.id
              );
        END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_comment_reply ON comments;
CREATE TRIGGER trg_notify_comment_reply
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE PROCEDURE public.notify_comment_reply();


-- 2. Notify on Level Up
CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS trigger AS $$
BEGIN
  -- Check if level increased
  IF NEW.current_level > OLD.current_level THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'level_up',
      '¡Subiste de Nivel!',
      'Has alcanzado el Nivel ' || NEW.current_level || '. ¡Descubre tus nuevas ventajas!',
      '/logros'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_level_up ON gamification_profiles;
CREATE TRIGGER trg_notify_level_up
  AFTER UPDATE ON gamification_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.notify_level_up();


-- 3. Notify on Badge Earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS trigger AS $$
DECLARE
  v_badge_name TEXT;
BEGIN
  -- Get badge name
  SELECT name INTO v_badge_name
  FROM gamification_badges
  WHERE id = NEW.badge_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'badge_earned',
    '¡Nueva Insignia Desbloqueada!',
    'Has ganado la insignia "' || v_badge_name || '".',
    '/logros'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_badge_earned ON gamification_user_badges;
CREATE TRIGGER trg_notify_badge_earned
  AFTER INSERT ON gamification_user_badges
  FOR EACH ROW EXECUTE PROCEDURE public.notify_badge_earned();
