-- Add is_primary flag to videos
ALTER TABLE IF EXISTS videos
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

