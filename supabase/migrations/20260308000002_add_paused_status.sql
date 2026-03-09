
-- Update status check constraint to include 'paused'
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;
ALTER TABLE deals ADD CONSTRAINT deals_status_check CHECK (status::text = ANY (ARRAY['active', 'expired', 'deleted', 'pending', 'rejected', 'revision', 'paused']::text[]));
