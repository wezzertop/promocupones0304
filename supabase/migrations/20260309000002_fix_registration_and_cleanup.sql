-- Fix User Registration and Cleanup Database
-- This migration addresses "Database error saving new user" and profile visibility issues.

-- 1. CLEANUP ORPHANED PROFILES (Optional but recommended for "weird things")
-- Remove profiles that don't have a corresponding user in auth.users
-- Note: This requires permissions on auth.users which usually exists for postgres/service_role
-- We use a DO block to avoid errors if permissions are tight, but in migration runner it should work.
DO $$
BEGIN
    -- Delete users from public.users that don't exist in auth.users
    -- This fixes cases where a user was deleted from Auth but stuck in Public, blocking registration of same username/email
    DELETE FROM public.users
    WHERE id NOT IN (SELECT id FROM auth.users);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not cleanup orphaned users (permission issue likely): %', SQLERRM;
END $$;


-- 2. IMPROVE REGISTRATION TRIGGER
-- Re-create the trigger function with better error handling and search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  new_avatar TEXT;
BEGIN
  -- Get metadata
  new_username := new.raw_user_meta_data->>'username';
  new_avatar := new.raw_user_meta_data->>'avatar_url';

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
      'user',
      0
  )
  ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      username = EXCLUDED.username,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      updated_at = NOW();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger is bound
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. ENSURE PERMISSIONS
-- Grant necessary permissions to allow the trigger and app to work
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure authenticated users can read all tables (RLS will filter, but basic permission needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;


-- 4. FIX RLS POLICIES FOR USERS (Redundant if previous migration ran, but safe to repeat)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read of profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT
    USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Explicitly allow service_role to do anything (bypass RLS)
-- Note: service_role bypasses RLS by default, but this is for clarity if using other roles
-- No policy needed for service_role usually.


-- 5. FIX CATEGORIES AND STORES (Ensure they are visible)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);

-- 6. FIX BADGES (If they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gamification_badges') THEN
        ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Anyone can view badges" ON gamification_badges;
        CREATE POLICY "Anyone can view badges" ON gamification_badges FOR SELECT USING (true);
    END IF;
END $$;
