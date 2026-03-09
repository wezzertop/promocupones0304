-- Allow everyone to view profiles (needed for comments to show user info)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
    FOR SELECT
    TO public
    USING (true);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

GRANT SELECT ON users TO anon, authenticated, service_role;
