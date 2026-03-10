-- Fix auth trigger with robust error handling and constraints
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
  base_username TEXT;
BEGIN
  -- 1. Get metadata safely
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- 2. Determine Role
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- 3. Generate Username if missing
  IF new_username IS NULL OR new_username = '' THEN
      -- Use email part or fallback to 'user'
      base_username := COALESCE(split_part(new.email, '@', 1), 'user');
      -- Clean up username (keep only alphanumeric)
      base_username := regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g');
      
      -- Fallback if empty after cleanup
      IF base_username = '' THEN
        base_username := 'user';
      END IF;

      -- Truncate to 40 chars to leave room for suffix
      base_username := substring(base_username from 1 for 40);
      new_username := base_username;
      
      -- Ensure uniqueness
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := base_username || '_' || substring(md5(random()::text) from 1 for 4);
      END IF;
      
      -- Double check uniqueness, if still fails, use random UUID segment
      IF EXISTS (SELECT 1 FROM public.users WHERE username = new_username) THEN
          new_username := base_username || '_' || substring(md5(new.id::text) from 1 for 6);
      END IF;
  END IF;

  -- 4. Final safety truncation
  new_username := substring(new_username from 1 for 50);

  -- 5. Insert/Update
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
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      role = CASE 
        WHEN public.users.role = 'user' AND EXCLUDED.role = 'verified' THEN 'verified'
        ELSE public.users.role
      END,
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant permissions just in case
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;
