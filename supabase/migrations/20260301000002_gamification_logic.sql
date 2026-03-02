-- Gamification Logic: Functions and Triggers

-- 1. Leaderboard Function
CREATE OR REPLACE FUNCTION get_leaderboard(period_start TIMESTAMP WITH TIME ZONE DEFAULT NULL, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    avatar_url TEXT,
    total_xp BIGINT,
    current_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.username,
        u.avatar_url,
        COALESCE(SUM(h.amount), 0) as total_xp,
        p.current_level
    FROM 
        users u
    JOIN 
        gamification_profiles p ON u.id = p.user_id
    LEFT JOIN 
        gamification_xp_history h ON u.id = h.user_id
    WHERE 
        (period_start IS NULL OR h.created_at >= period_start)
    GROUP BY 
        u.id, u.username, u.avatar_url, p.current_level
    ORDER BY 
        total_xp DESC
    LIMIT 
        limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Badge Check Functions

-- Trigger for First Post Badge
CREATE OR REPLACE FUNCTION check_post_badges()
RETURNS trigger AS $$
DECLARE
    v_post_count INTEGER;
    v_badge_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := new.user_id;
    
    -- Count posts
    SELECT count(*) INTO v_post_count FROM deals WHERE user_id = v_user_id;
    
    -- First Post Badge
    IF v_post_count = 1 THEN
        SELECT id INTO v_badge_id FROM gamification_badges WHERE slug = 'first_post';
        IF v_badge_id IS NOT NULL THEN
            INSERT INTO gamification_user_badges (user_id, badge_id)
            VALUES (v_user_id, v_badge_id)
            ON CONFLICT DO NOTHING;
            
            -- Award XP for badge
            PERFORM add_xp(v_user_id, (SELECT xp_reward FROM gamification_badges WHERE id = v_badge_id), 'badge', v_badge_id);
        END IF;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_created_badges ON deals;
CREATE TRIGGER on_post_created_badges
    AFTER INSERT ON deals
    FOR EACH ROW EXECUTE PROCEDURE check_post_badges();

-- Trigger for First Comment Badge
CREATE OR REPLACE FUNCTION check_comment_badges()
RETURNS trigger AS $$
DECLARE
    v_comment_count INTEGER;
    v_badge_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := new.user_id;
    
    -- Count comments
    SELECT count(*) INTO v_comment_count FROM comments WHERE user_id = v_user_id;
    
    -- First Comment Badge
    IF v_comment_count = 1 THEN
        SELECT id INTO v_badge_id FROM gamification_badges WHERE slug = 'first_comment';
        IF v_badge_id IS NOT NULL THEN
            INSERT INTO gamification_user_badges (user_id, badge_id)
            VALUES (v_user_id, v_badge_id)
            ON CONFLICT DO NOTHING;
            
             -- Award XP for badge
            PERFORM add_xp(v_user_id, (SELECT xp_reward FROM gamification_badges WHERE id = v_badge_id), 'badge', v_badge_id);
        END IF;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_badges ON comments;
CREATE TRIGGER on_comment_created_badges
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE PROCEDURE check_comment_badges();

-- 3. XP Awarding Triggers

-- Trigger to award XP for new Deal
CREATE OR REPLACE FUNCTION award_xp_new_deal()
RETURNS trigger AS $$
BEGIN
    PERFORM add_xp(new.user_id, 50, 'post', new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_created_xp ON deals;
CREATE TRIGGER on_deal_created_xp
    AFTER INSERT ON deals
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_deal();

-- Trigger to award XP for new Comment
CREATE OR REPLACE FUNCTION award_xp_new_comment()
RETURNS trigger AS $$
BEGIN
    PERFORM add_xp(new.user_id, 10, 'comment', new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_xp ON comments;
CREATE TRIGGER on_comment_created_xp
    AFTER INSERT ON comments
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_comment();
    
-- Trigger to award XP for Voting
CREATE OR REPLACE FUNCTION award_xp_new_vote()
RETURNS trigger AS $$
BEGIN
    -- Only award if it's a new vote, not an update
    IF (TG_OP = 'INSERT') THEN
        PERFORM add_xp(new.user_id, 2, 'vote', new.id);
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_created_xp ON votes;
CREATE TRIGGER on_vote_created_xp
    AFTER INSERT ON votes
    FOR EACH ROW EXECUTE PROCEDURE award_xp_new_vote();
