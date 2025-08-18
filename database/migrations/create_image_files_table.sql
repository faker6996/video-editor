-- Migration: Create image_files table
-- File: database/migrations/create_image_files_table.sql
-- Follow existing project pattern - no foreign keys
-- PostgreSQL compatible syntax

CREATE TABLE IF NOT EXISTS image_files (
  id VARCHAR(36) PRIMARY KEY,                  -- UUID primary key
  path VARCHAR(500) NOT NULL,                  -- Relative path: /uploads/2024/01/abc123.jpg
  original_name VARCHAR(255) NOT NULL,        -- Original filename: photo.jpg
  size BIGINT NOT NULL,                        -- File size in bytes
  mime_type VARCHAR(100) NOT NULL,             -- MIME type: image/jpeg
  width INT DEFAULT NULL,                      -- Image width in pixels
  height INT DEFAULT NULL,                     -- Image height in pixels
  task_id VARCHAR(36) DEFAULT NULL,            -- Reference to OCR task (no foreign key)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes separately in PostgreSQL
CREATE INDEX IF NOT EXISTS idx_image_files_task_id ON image_files (task_id);
CREATE INDEX IF NOT EXISTS idx_image_files_created_at ON image_files (created_at);
CREATE INDEX IF NOT EXISTS idx_image_files_mime_type ON image_files (mime_type);

-- Add some useful stored procedures/functions
-- Note: URL generation handled in application layer for flexibility

-- View for easy image queries with relative URLs (host-agnostic)
CREATE OR REPLACE VIEW v_image_files AS
SELECT 
  id,
  path,
  original_name,
  size,
  mime_type,
  width,
  height,
  task_id,
  created_at,
  updated_at,
  CONCAT('/api/uploads', path) as relative_url,
  CASE 
    WHEN size < 1024 THEN CONCAT(size::TEXT, ' B')
    WHEN size < 1024 * 1024 THEN CONCAT(ROUND(size / 1024.0, 1)::TEXT, ' KB')
    WHEN size < 1024 * 1024 * 1024 THEN CONCAT(ROUND(size / (1024.0 * 1024), 1)::TEXT, ' MB')
    ELSE CONCAT(ROUND(size / (1024.0 * 1024 * 1024), 1)::TEXT, ' GB')
  END as formatted_size
FROM image_files;

-- Cleanup function for old files (PostgreSQL version)
CREATE OR REPLACE FUNCTION cleanup_old_images(days_old INT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete orphaned images older than specified days
  DELETE FROM image_files 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old
  AND task_id IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Note: Physical file deletion should be handled by application layer
  -- as PostgreSQL cannot directly delete files from filesystem
  
  RETURN deleted_count;
END;
$$;