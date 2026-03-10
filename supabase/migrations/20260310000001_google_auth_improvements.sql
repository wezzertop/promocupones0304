-- Improve Google Auth handling by setting verified role for confirmed users
-- This ensures Google users skip verification steps logically in the app

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
BEGIN
  -- Get metadata
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- Determine role based on email confirmation
  -- OAuth users have email_confirmed_at set on creation
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- Fallback for username if missing (e.g. OAuth)
  IF new_username IS NULL OR new_username = '' THEN
      new_username := split_part(new.email, '@', 1);
      -- Ensure uniqueness (simple append)
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := new_username || '_' || substring(md5(random()::text) from 1 for 4);
      END IF;
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
  VALUES (
      new.id, 
      new.email, 
      new_username, 
      new_avatar,
      initial_role,
      0
  )
  ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      -- Update role if user becomes verified (e.g. email confirmation later)
      -- But we only want to upgrade, not downgrade
      role = CASE 
        WHEN public.users.role = 'user' AND EXCLUDED.role = 'verified' THEN 'verified'
        ELSE public.users.role
      END,
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
