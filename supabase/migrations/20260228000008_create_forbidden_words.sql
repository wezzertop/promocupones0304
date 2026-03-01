
CREATE TABLE IF NOT EXISTS forbidden_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE forbidden_words ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view forbidden words" ON forbidden_words
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert forbidden words" ON forbidden_words
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete forbidden words" ON forbidden_words
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Also allow authenticated users to read (for client-side validation if needed, though server-side is safer)
-- Actually, better to keep it server-side or accessible via a specific function to avoid leaking the list easily?
-- For now, let's allow read for all authenticated users so we can validate in the client if we want to give immediate feedback.
CREATE POLICY "Authenticated users can view forbidden words" ON forbidden_words
    FOR SELECT
    USING (auth.role() = 'authenticated');
