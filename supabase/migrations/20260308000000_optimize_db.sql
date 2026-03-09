-- Optimize Database Performance with Indexes

-- Deals Table Indexes
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_category_id ON deals(category_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_votes_count ON deals(votes_count DESC);

-- Comments Table Indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deal_id ON comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Votes Table Indexes
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_deal_id ON votes(deal_id);
CREATE INDEX IF NOT EXISTS idx_votes_composite ON votes(user_id, deal_id); -- For quick lookup of user vote on a deal

-- Notifications Table Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Gamification Indexes
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON gamification_xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON gamification_user_badges(user_id);

-- Search Optimization (GIN index for text search on title/description)
-- Assumes pg_trgm extension is enabled, if not we might skip or enable it.
-- Let's enable it just in case, it's standard for search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_deals_title_trgm ON deals USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_description_trgm ON deals USING gin (description gin_trgm_ops);
