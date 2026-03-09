-- Fix Gamification Trigger and Backfill
-- This ensures that user creation doesn't fail due to gamification errors

-- 1. Ensure Levels Exist (Idempotent seed)
INSERT INTO gamification_levels (level, xp_required, referral_limit, title) VALUES
(1, 0, 2, 'Novato'),
(2, 100, 2, 'Aprendiz'),
(3, 250, 2, 'Explorador'),
(4, 500, 2, 'Entusiasta'),
(5, 800, 2, 'Habitual'),
(6, 1200, 2, 'Veterano'),
(7, 1700, 2, 'Experto'),
(8, 2300, 2, 'Maestro'),
(9, 3000, 2, 'Leyenda'),
(10, 4000, 5, 'Mítico')
ON CONFLICT (level) DO NOTHING;

-- 2. Improve Gamification Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger AS $$
DECLARE
    v_next_xp INTEGER;
BEGIN
  -- Get next level XP safely
  SELECT xp_required INTO v_next_xp FROM gamification_levels WHERE level = 2;
  IF v_next_xp IS NULL THEN
      v_next_xp := 100; -- Fallback default
  END IF;

  INSERT INTO public.gamification_profiles (user_id, referral_code, next_level_xp)
  VALUES (
      new.id, 
      upper(substring(md5(random()::text) from 1 for 8)),
      v_next_xp
  )
  ON CONFLICT (user_id) DO NOTHING; -- Avoid error if already exists

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Backfill missing gamification profiles for existing users
DO $$
DECLARE
    r RECORD;
    v_next_xp INTEGER;
BEGIN
    SELECT xp_required INTO v_next_xp FROM gamification_levels WHERE level = 2;
    IF v_next_xp IS NULL THEN v_next_xp := 100; END IF;

    FOR r IN SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM gamification_profiles) LOOP
        INSERT INTO gamification_profiles (user_id, referral_code, next_level_xp)
        VALUES (
            r.id, 
            upper(substring(md5(random()::text) from 1 for 8)),
            v_next_xp
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
