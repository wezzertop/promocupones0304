-- Fix RLS policies to allow admins/moderators to view all deals
-- and users to view their own deals regardless of status.

-- Drop existing restrictive policy if it exists (it was created in 20240227000000_init_schema.sql)
DROP POLICY IF EXISTS "Anyone can view active deals" ON deals;
DROP POLICY IF EXISTS "Admins and Moderators can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view own deals" ON deals;

-- Recreate "Anyone can view active deals" (same as before, but ensuring it's there)
CREATE POLICY "Anyone can view active deals" ON deals
    FOR SELECT USING (status = 'active');

-- Allow Admins and Moderators to view ALL deals
CREATE POLICY "Admins and Moderators can view all deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'moderator')
        )
    );

-- Allow Users to view their OWN deals (regardless of status)
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (auth.uid() = user_id);

-- Update existing pending deals to active to make them visible immediately
-- (Since the user wants everyone to see the content)
UPDATE deals SET status = 'active' WHERE status = 'pending';
