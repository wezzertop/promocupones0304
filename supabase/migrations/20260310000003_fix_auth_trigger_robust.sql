-- 1. Clean up orphan users (users in public.users but not in auth.users)
-- This prevents "Email already exists" errors when re-registering after deleting from Auth
DELETE FROM public.users 
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Drop and recreate the trigger with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
  initial_role VARCHAR(20);
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Safe metadata extraction
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';
  
  -- Determine Role
  IF new.email_confirmed_at IS NOT NULL THEN
    initial_role := 'verified';
  ELSE
    initial_role := 'user';
  END IF;

  -- Generate Username
  -- Priority: 1. Metadata username, 2. Email prefix, 3. 'user'
  base_username := COALESCE(new_username, split_part(new.email, '@', 1), 'user');
  
  -- Sanitize: Allow only alphanumeric, underscores, and hyphens
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_-]', '', 'g');
  
  -- Ensure non-empty
  IF length(base_username) < 3 THEN
    base_username := 'user_' || substring(md5(random()::text) from 1 for 6);
  END IF;

  -- Truncate to avoid overflow (leaving space for suffix)
  base_username := substring(base_username from 1 for 30);
  final_username := base_username;

  -- Check for username collision and append suffix if needed
  IF EXISTS (SELECT 1 FROM public.users WHERE username = final_username) THEN
    final_username := base_username || '_' || substring(md5(new.id::text) from 1 for 4);
  END IF;
  
  -- Second check (just in case)
  IF EXISTS (SELECT 1 FROM public.users WHERE username = final_username) THEN
    final_username := base_username || '_' || floor(random() * 10000)::text;
  END IF;

  -- Insert with explicit error handling preference
  BEGIN
    INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
    VALUES (
        new.id, 
        new.email, 
        final_username, 
        new_avatar,
        initial_role,
        0
    );
  EXCEPTION WHEN unique_violation THEN
    -- If email exists (orphan that wasn't cleaned), we can't do much but fail.
    -- But we can try to insert with a random email to at least allow login? 
    -- No, that corrupts data. 
    -- If unique_violation is on username, our logic above should have caught it, 
    -- but race conditions exist.
    
    -- Retry with a definitely unique username
    INSERT INTO public.users (id, email, username, avatar_url, role, karma_points)
    VALUES (
        new.id, 
        new.email, 
        'u_' || substring(md5(new.id::text) from 1 for 10), 
        new_avatar,
        initial_role,
        0
    );
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
