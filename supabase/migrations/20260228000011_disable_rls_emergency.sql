-- EMERGENCY: DISABLE RLS TO RESTORE VISIBILITY
-- Run this script to immediately make all content visible while we debug permissions.

-- Disable RLS on main tables
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Ensure all deals are active (just in case)
UPDATE deals SET status = 'active' WHERE status = 'pending';
