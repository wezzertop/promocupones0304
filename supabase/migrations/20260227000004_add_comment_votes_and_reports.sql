-- Create comment_votes table
CREATE TABLE comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);

-- Enable RLS
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Policies for Comment Votes
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment votes" ON comment_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment votes" ON comment_votes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment votes" ON comment_votes
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON comment_votes TO authenticated;
GRANT SELECT ON comment_votes TO anon;

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- Can be deal_id or comment_id
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('deal', 'comment')),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_target ON reports(target_id, target_type);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for Reports
CREATE POLICY "Authenticated users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON reports TO authenticated;
