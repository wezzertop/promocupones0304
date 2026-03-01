-- FIX ALL PERMISSIONS AND POLICIES
-- Run this script to fix "Error fetching deals" and visibility issues.

-- 1. DEALS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;

-- Anyone can see active deals
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

-- Admins/Mods see everything
CREATE POLICY "Admins and Moderators can view all deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Users see their own deals (even if pending/rejected)
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (auth.uid() = user_id);

-- Update status to ensure visibility
UPDATE deals SET status = 'active' WHERE status = 'pending';


-- 2. COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
-- Drop potentially conflicting policies from other migrations
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "Authenticated insert" ON comments;

-- Everyone can view comments (CRITICAL for comments(count) to work)
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can comment
CREATE POLICY "Authenticated users can comment" ON comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users manage their own comments
CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3. VOTES
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deal_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;

-- Everyone can view votes
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can vote
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);


-- 4. USERS (Profiles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Everyone can view profiles (needed to see who posted the deal)
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);


-- 5. STORES & CATEGORIES
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "Anyone can view stores" ON stores
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT TO anon, authenticated USING (true);
