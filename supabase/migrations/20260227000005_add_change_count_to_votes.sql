-- Add change_count column to track vote changes
ALTER TABLE public.comment_votes 
ADD COLUMN IF NOT EXISTS change_count INTEGER DEFAULT 0;
