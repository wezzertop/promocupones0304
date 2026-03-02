-- Add is_referral column to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_referral BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_deals_is_referral ON deals(is_referral);

-- Update Level Limits
-- Level 1-9: 0 referrals
UPDATE gamification_levels SET referral_limit = 0 WHERE level < 10;

-- Level 10-19: 2 referrals
UPDATE gamification_levels SET referral_limit = 2 WHERE level BETWEEN 10 AND 19;

-- Level 20-49: 10 referrals (keeping previous scale starting from 20)
UPDATE gamification_levels SET referral_limit = 10 WHERE level BETWEEN 20 AND 49;

-- Level 50+: 20 referrals (or whatever the max was)
UPDATE gamification_levels SET referral_limit = 20 WHERE level >= 50;
