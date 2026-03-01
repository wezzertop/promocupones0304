-- RESTORE AND FIX SECURITY (RLS)
-- This script re-enables RLS and sets correct policies for all tables.

-- 1. DEALS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;
DROP POLICY IF EXISTS "Users can update own deals" ON deals;

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

-- Authenticated users can create deals
CREATE POLICY "Authenticated users can create deals" ON deals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own deals
CREATE POLICY "Users can update own deals" ON deals
    FOR UPDATE USING (auth.uid() = user_id);


-- 2. COMMENTS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Public comments" ON comments;
DROP POLICY IF EXISTS "Authenticated insert" ON comments;

-- Everyone can view comments
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
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
DROP POLICY IF EXISTS "Users can update own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON votes;

-- Everyone can view votes
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT TO anon, authenticated USING (true);

-- Auth users can vote
CREATE POLICY "Authenticated users can vote" ON votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON votes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 4. USERS (Profiles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT TO anon, authenticated USING (true);

-- Users can update own profile
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

-- 6. SAVES
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saves" ON saves;
DROP POLICY IF EXISTS "Users can create saves" ON saves;
DROP POLICY IF EXISTS "Users can delete saves" ON saves;

CREATE POLICY "Users can view own saves" ON saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create saves" ON saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saves" ON saves
    FOR DELETE USING (auth.uid() = user_id);


-- 7. REPORTS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

CREATE POLICY "Admins can view reports" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);


-- 8. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Ideally restricted to service role, but open for now for function triggers

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

