-- Gamification System Tables

-- 1. Levels Table
CREATE TABLE IF NOT EXISTS gamification_levels (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    referral_limit INTEGER NOT NULL,
    title VARCHAR(50) NOT NULL,
    icon_url TEXT
);

-- Seed Levels (Formula: Previous + Level * 100 or similar, manually adjusted for smooth progression)
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
(10, 4000, 5, 'Mítico'),
(11, 5500, 5, 'Titán'),
(12, 7000, 5, 'Semidiós'),
(13, 9000, 5, 'Divino'),
(14, 11000, 5, 'Inmortal'),
(15, 14000, 5, 'Omnipresente'),
(16, 17000, 5, 'Eterno'),
(17, 21000, 5, 'Infinito'),
(18, 25000, 5, 'Supremo'),
(19, 30000, 5, 'Universal'),
(20, 36000, 10, 'Cósmico'),
(21, 43000, 10, 'Trascendente'),
(22, 50000, 10, 'Iluminado'),
(23, 60000, 10, 'Soberano'),
(24, 70000, 10, 'Majestuoso'),
(25, 80000, 10, 'Imperial'),
(26, 95000, 10, 'Celestial'),
(27, 110000, 10, 'Galáctico'),
(28, 130000, 10, 'Estelar'),
(29, 150000, 10, 'Nebular'),
(30, 175000, 10, 'Cuántico'),
(31, 200000, 10, 'Dimensional'),
(32, 230000, 10, 'Temporal'),
(33, 260000, 10, 'Eterno II'),
(34, 300000, 10, 'Infinito II'),
(35, 340000, 10, 'Supremo II'),
(36, 390000, 10, 'Universal II'),
(37, 440000, 10, 'Cósmico II'),
(38, 500000, 10, 'Trascendente II'),
(39, 560000, 10, 'Iluminado II'),
(40, 630000, 10, 'Soberano II'),
(41, 700000, 10, 'Majestuoso II'),
(42, 780000, 10, 'Imperial II'),
(43, 860000, 10, 'Celestial II'),
(44, 950000, 10, 'Galáctico II'),
(45, 1050000, 10, 'Estelar II'),
(46, 1150000, 10, 'Nebular II'),
(47, 1260000, 10, 'Cuántico II'),
(48, 1380000, 10, 'Dimensional II'),
(49, 1500000, 10, 'Temporal II'),
(50, 1630000, 10, 'Omega'),
(80, 5000000, 20, 'Alpha Omega') -- Jump to level 80 for the requirement
ON CONFLICT (level) DO NOTHING;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS gamification_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1 REFERENCES gamification_levels(level),
    current_xp INTEGER NOT NULL DEFAULT 0,
    next_level_xp INTEGER NOT NULL DEFAULT 100,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamification_profiles_level ON gamification_profiles(current_level);
CREATE INDEX idx_gamification_profiles_xp ON gamification_profiles(current_xp DESC);

-- 3. Badges Table
CREATE TABLE IF NOT EXISTS gamification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Badges
INSERT INTO gamification_badges (slug, name, description, xp_reward, category) VALUES
('first_post', 'Primera Publicación', 'Has publicado tu primera oferta.', 50, 'posting'),
('first_comment', 'Primer Comentario', 'Has comentado por primera vez.', 20, 'social'),
('popular', 'Popular', 'Tu publicación alcanzó 100 votos.', 200, 'posting'),
('influencer', 'Influencer', 'Has referido a 5 usuarios.', 500, 'social'),
('verified', 'Verificado', 'Has verificado tu cuenta.', 100, 'general')
ON CONFLICT (slug) DO NOTHING;

-- 4. User Badges Table
CREATE TABLE IF NOT EXISTS gamification_user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES gamification_badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, badge_id)
);

-- 5. XP History Table
CREATE TABLE IF NOT EXISTS gamification_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamification_xp_history_user ON gamification_xp_history(user_id);

-- 6. Referrals Tracking Table
CREATE TABLE IF NOT EXISTS gamification_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

CREATE INDEX idx_gamification_referrals_referrer ON gamification_referrals(referrer_id);

-- 7. Functions and Triggers

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.gamification_profiles (user_id, referral_code, next_level_xp)
  VALUES (
      new.id, 
      upper(substring(md5(random()::text) from 1 for 8)),
      (SELECT xp_required FROM gamification_levels WHERE level = 2)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_user_created_gamification ON public.users;
CREATE TRIGGER on_user_created_gamification
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_gamification();

-- Initialize existing users if any
INSERT INTO gamification_profiles (user_id, referral_code, next_level_xp)
SELECT 
    id, 
    upper(substring(md5(random()::text) from 1 for 8)),
    (SELECT xp_required FROM gamification_levels WHERE level = 2)
FROM users
WHERE id NOT IN (SELECT user_id FROM gamification_profiles);

-- Function to Add XP
CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_type VARCHAR,
    p_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_next_level_xp INTEGER;
    v_xp_required_for_next INTEGER;
    v_leveled_up BOOLEAN := FALSE;
    v_new_level INTEGER;
BEGIN
    -- Get current state
    SELECT current_xp, current_level INTO v_current_xp, v_current_level
    FROM gamification_profiles
    WHERE user_id = p_user_id;
    
    IF v_current_xp IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Update XP
    v_current_xp := v_current_xp + p_amount;
    
    UPDATE gamification_profiles
    SET current_xp = v_current_xp,
        last_activity_date = NOW()
    WHERE user_id = p_user_id;

    -- Log History
    INSERT INTO gamification_xp_history (user_id, amount, source_type, source_id)
    VALUES (p_user_id, p_amount, p_source_type, p_source_id);

    -- Check for level up
    LOOP
        SELECT xp_required INTO v_xp_required_for_next
        FROM gamification_levels
        WHERE level = v_current_level + 1;

        IF v_xp_required_for_next IS NULL THEN
            EXIT; -- Max level
        END IF;

        IF v_current_xp >= v_xp_required_for_next THEN
            v_current_level := v_current_level + 1;
            v_leveled_up := TRUE;
            
            -- Grant badges or other rewards here if needed
            
            UPDATE gamification_profiles
            SET current_level = v_current_level,
                next_level_xp = (SELECT xp_required FROM gamification_levels WHERE level = v_current_level + 1)
            WHERE user_id = p_user_id;
        ELSE
            EXIT;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'new_xp', v_current_xp,
        'new_level', v_current_level,
        'leveled_up', v_leveled_up
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

ALTER TABLE gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view levels" ON gamification_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view gamification profiles" ON gamification_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can view badges" ON gamification_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view user badges" ON gamification_user_badges FOR SELECT USING (true);
CREATE POLICY "Users can view own xp history" ON gamification_xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referrals" ON gamification_referrals FOR SELECT USING (auth.uid() = referrer_id);
