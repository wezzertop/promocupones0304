
-- Add shipping_type column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS shipping_type text DEFAULT 'none';

-- Optional: Add check constraint for valid values
ALTER TABLE deals ADD CONSTRAINT deals_shipping_type_check CHECK (shipping_type IN ('none', 'free', 'prime', 'meliplus', 'full'));
