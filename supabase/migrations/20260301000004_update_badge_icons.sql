-- Update badge icon URLs
UPDATE gamification_badges SET icon_url = '/badges/first_post.svg' WHERE slug = 'first_post';
UPDATE gamification_badges SET icon_url = '/badges/first_comment.svg' WHERE slug = 'first_comment';
UPDATE gamification_badges SET icon_url = '/badges/popular.svg' WHERE slug = 'popular';
UPDATE gamification_badges SET icon_url = '/badges/influencer.svg' WHERE slug = 'influencer';
UPDATE gamification_badges SET icon_url = '/badges/verified.svg' WHERE slug = 'verified';
