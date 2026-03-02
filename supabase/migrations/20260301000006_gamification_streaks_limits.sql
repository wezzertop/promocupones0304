-- Gamification Updates: Streaks & Limits

-- 1. Daily Streaks Table
CREATE TABLE IF NOT EXISTS gamification_daily_streaks (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Users can view own streaks" ON gamification_daily_streaks FOR SELECT USING (auth.uid() = user_id);

-- 2. Function to Claim Daily Bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_last_login DATE;
    v_current_streak INTEGER;
    v_today DATE := CURRENT_DATE;
    v_bonus_xp INTEGER;
    v_streak_updated BOOLEAN := FALSE;
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
        v_bonus_xp := 10; -- First day bonus
        PERFORM add_xp(p_user_id, v_bonus_xp, 'daily_streak', NULL);
        
        RETURN jsonb_build_object(
            'success', true,
            'streak', 1,
            'xp_awarded', v_bonus_xp,
            'message', '¡Primer día! Has ganado 10 XP.'
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

    -- Calculate XP: Base 10 * Streak (Max 100 XP)
    v_bonus_xp := 10 * v_current_streak;

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


-- 3. Update Vote Trigger to Limit 5 XP-awarding votes per day
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
DECLARE
    v_today_votes INTEGER;
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        -- Count votes by this user today
        SELECT count(*) INTO v_today_votes
        FROM gamification_xp_history
        WHERE user_id = new.user_id
          AND source_type = 'vote'
          AND created_at >= CURRENT_DATE;
          
        -- Limit to 5 per day
        IF v_today_votes < 5 THEN
            PERFORM add_xp(new.user_id, 2, 'vote', new.id);
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger to ensure it uses the new function version
DROP TRIGGER IF EXISTS on_vote_created_xp ON votes;
CREATE TRIGGER on_vote_created_xp
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_vote();
