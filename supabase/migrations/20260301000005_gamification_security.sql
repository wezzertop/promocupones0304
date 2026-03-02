-- Gamification Security & Negative XP Logic

-- Function to Remove XP
CREATE OR REPLACE FUNCTION remove_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_type VARCHAR,
    p_source_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_xp INTEGER;
BEGIN
    -- Get current state
    SELECT current_xp, current_level INTO v_current_xp, v_current_level
    FROM gamification_profiles
    WHERE user_id = p_user_id;
    
    IF v_current_xp IS NULL THEN
        -- If profile doesn't exist, ignore (should not happen for active users)
        RETURN jsonb_build_object('success', false);
    END IF;

    -- Calculate new XP (allow negative for calculation, but floor at 0 in update if desired)
    -- For now, we allow XP to drop.
    v_new_xp := GREATEST(0, v_current_xp - p_amount);
    
    UPDATE gamification_profiles
    SET current_xp = v_new_xp
    WHERE user_id = p_user_id;

    -- Log History (Negative amount)
    INSERT INTO gamification_xp_history (user_id, amount, source_type, source_id)
    VALUES (p_user_id, -p_amount, p_source_type, p_source_id);

    -- NOTE: We are NOT implementing de-leveling logic for simplicity and user experience.
    -- Users keep their level even if XP drops below threshold, but they must earn back XP to progress.
    -- This prevents "yo-yo" leveling effects.

    RETURN jsonb_build_object(
        'new_xp', v_new_xp,
        'removed_amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Trigger for Removing Vote (Unlike/Unvote)
CREATE OR REPLACE FUNCTION reverse_xp_vote_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 2 XP when a vote is deleted
    PERFORM remove_xp(old.user_id, 2, 'vote_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vote_deleted_xp ON votes;
CREATE TRIGGER on_vote_deleted_xp
    AFTER DELETE ON votes
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_vote_removed();


-- 2. Trigger for Removing Comment
CREATE OR REPLACE FUNCTION reverse_xp_comment_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 10 XP when a comment is deleted
    PERFORM remove_xp(old.user_id, 10, 'comment_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_deleted_xp ON comments;
CREATE TRIGGER on_comment_deleted_xp
    AFTER DELETE ON comments
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_comment_removed();


-- 3. Trigger for Removing Deal (Optional but recommended for consistency)
CREATE OR REPLACE FUNCTION reverse_xp_deal_removed()
RETURNS trigger AS $$
BEGIN
    -- Deduct 50 XP when a deal is deleted
    PERFORM remove_xp(old.user_id, 50, 'post_removed', old.id);
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deal_deleted_xp ON deals;
CREATE TRIGGER on_deal_deleted_xp
    AFTER DELETE ON deals
    FOR EACH ROW EXECUTE PROCEDURE reverse_xp_deal_removed();
