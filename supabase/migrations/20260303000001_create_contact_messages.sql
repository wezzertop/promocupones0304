-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional, if user is logged in
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200), -- Optional
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45) -- IPv6 support
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- RLS Policies
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated users can create messages
CREATE POLICY "Anyone can create contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update contact messages" ON contact_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
