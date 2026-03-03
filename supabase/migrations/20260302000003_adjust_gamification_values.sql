-- Adjust Gamification Values to slow down progression

-- 1. Update Level Requirements (Significant increase)
UPDATE gamification_levels SET xp_required = 0 WHERE level = 1;
UPDATE gamification_levels SET xp_required = 300 WHERE level = 2;
UPDATE gamification_levels SET xp_required = 800 WHERE level = 3;
UPDATE gamification_levels SET xp_required = 1500 WHERE level = 4;
UPDATE gamification_levels SET xp_required = 2500 WHERE level = 5;
UPDATE gamification_levels SET xp_required = 4000 WHERE level = 6;
UPDATE gamification_levels SET xp_required = 6000 WHERE level = 7;
UPDATE gamification_levels SET xp_required = 8500 WHERE level = 8;
UPDATE gamification_levels SET xp_required = 11500 WHERE level = 9;
UPDATE gamification_levels SET xp_required = 15000 WHERE level = 10;
UPDATE gamification_levels SET xp_required = 20000 WHERE level = 11;
UPDATE gamification_levels SET xp_required = 26000 WHERE level = 12;
UPDATE gamification_levels SET xp_required = 33000 WHERE level = 13;
UPDATE gamification_levels SET xp_required = 41000 WHERE level = 14;
UPDATE gamification_levels SET xp_required = 50000 WHERE level = 15;
-- Scale the rest
UPDATE gamification_levels SET xp_required = 60000 WHERE level = 16;
UPDATE gamification_levels SET xp_required = 72000 WHERE level = 17;
UPDATE gamification_levels SET xp_required = 85000 WHERE level = 18;
UPDATE gamification_levels SET xp_required = 100000 WHERE level = 19;
UPDATE gamification_levels SET xp_required = 120000 WHERE level = 20;

-- 2. Update Badge Rewards (Decrease XP)
UPDATE gamification_badges SET xp_reward = 30 WHERE slug = 'first_post';
UPDATE gamification_badges SET xp_reward = 10 WHERE slug = 'first_comment';
UPDATE gamification_badges SET xp_reward = 100 WHERE slug = 'popular';
UPDATE gamification_badges SET xp_reward = 200 WHERE slug = 'influencer';
UPDATE gamification_badges SET xp_reward = 50 WHERE slug = 'verified';

-- 3. Update XP Awarding Functions (Decrease XP & Add Limits)

-- New Deal: 50 -> 20 (Limit 3 per day)
CREATE OR REPLACE FUNCTION award_xp_new_deal()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Count posts by this user today
    SELECT count(*) INTO v_today_count
    FROM gamification_xp_history
    WHERE user_id = new.user_id
      AND source_type = 'post'
      AND created_at >= CURRENT_DATE;

    IF v_today_count < 3 THEN
        PERFORM add_xp(new.user_id, 20, 'post', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New Comment: 10 -> 5 (Limit 5 per day)
CREATE OR REPLACE FUNCTION award_xp_new_comment()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Count comments by this user today
    SELECT count(*) INTO v_today_count
    FROM gamification_xp_history
    WHERE user_id = new.user_id
      AND source_type = 'comment'
      AND created_at >= CURRENT_DATE;

    IF v_today_count < 5 THEN
        PERFORM add_xp(new.user_id, 5, 'comment', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New Vote: 2 -> 1 (Limit 10 per day)
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
DECLARE
    v_today_count INTEGER;
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        -- Count votes by this user today
        SELECT count(*) INTO v_today_count
        FROM gamification_xp_history
        WHERE user_id = new.user_id
          AND source_type = 'vote'
          AND created_at >= CURRENT_DATE;
          
        -- Limit to 10 per day
        IF v_today_count < 10 THEN
            PERFORM add_xp(new.user_id, 1, 'vote', new.id);
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Streak Bonus (Decrease XP)
-- Base 10 -> 5. Max 100 -> 50.
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_last_login DATE;
    v_current_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_bonus_xp INTEGER;
BEGIN
    -- Get current streak info
    SELECT last_login_date, current_streak INTO v_last_login, v_current_streak
    FROM gamification_daily_streaks
    WHERE user_id = p_user_id;

    -- Initialize if not exists
    IF v_last_login IS NULL THEN
        INSERT INTO gamification_daily_streaks (user_id, current_streak, last_login_date)
        VALUES (p_user_id, 1, v_today);
        
        v_current_streak := 1;
        v_bonus_xp := 5; -- First day bonus (Reduced from 10)
        PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', 1,
            'xp_awarded', v_bonus_xp,
            'message', '¡Primer día! Has ganado 5 XP.'
        );
    END IF;

    -- Check if already claimed today
    IF v_last_login = v_today THEN
        RETURN jsonb_build_object(
            'success', false,
            'streak', v_current_streak,
            'xp_awarded', 0,
            'message', 'Ya has reclamado tu bonus hoy.'
        );
    END IF;

    -- Check if streak continues (login was yesterday)
    IF v_last_login = v_today - 1 THEN
        v_current_streak := LEAST(10, v_current_streak + 1); -- Cap streak multiplier at 10
    ELSE
        -- Streak broken
        v_current_streak := 1;
    END IF;

    -- Calculate XP: Base 5 * Streak (Max 50 XP)
    v_bonus_xp := 5 * v_current_streak;

    -- Update Streak
    UPDATE gamification_daily_streaks
    SET current_streak = v_current_streak,
        last_login_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Award XP
    PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);

    RETURN jsonb_build_object(
        'success', true,
        'streak', v_current_streak,
        'xp_awarded', v_bonus_xp,
        'message', format('¡Racha de %s días! Has ganado %s XP.', v_current_streak, v_bonus_xp)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add Deduction Logic (Fair Play)

-- Deduct for Deal Deletion
CREATE OR REPLACE FUNCTION deduct_xp_delete_deal()
RETURNS trigger AS $$
BEGIN
    -- Deduct 20 XP (same as award)
    PERFORM add_xp(old.user_id, -20, 'penalty_post_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_deleted_xp ON deals;
CREATE TRIGGER on_deal_deleted_xp
    BEFORE DELETE ON deals
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_deal();

-- Deduct for Comment Deletion
CREATE OR REPLACE FUNCTION deduct_xp_delete_comment()
RETURNS trigger AS $$
BEGIN
    -- Deduct 5 XP
    PERFORM add_xp(old.user_id, -5, 'penalty_comment_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_deleted_xp ON comments;
CREATE TRIGGER on_comment_deleted_xp
    BEFORE DELETE ON comments
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_comment();

-- Deduct for Vote Deletion (Unlike)
CREATE OR REPLACE FUNCTION deduct_xp_delete_vote()
RETURNS trigger AS $$
BEGIN
    -- Deduct 1 XP
    PERFORM add_xp(old.user_id, -1, 'penalty_vote_delete', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_deleted_xp ON votes;
CREATE TRIGGER on_vote_deleted_xp
    BEFORE DELETE ON votes
    FOR EACH ROW EXECUTE PROCEDURE deduct_xp_delete_vote();

-- 6. Update existing profiles to reflect new next_level_xp
UPDATE gamification_profiles p
SET next_level_xp = (
    SELECT xp_required 
    FROM gamification_levels l 
    WHERE l.level = p.current_level + 1
);
