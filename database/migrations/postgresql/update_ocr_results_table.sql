-- Migration: Update ocr_results table for new API structure (PostgreSQL)
-- Purpose: Add new columns to support the updated OCR API response format

-- Add new columns to ocr_results table
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS text_count INTEGER DEFAULT 0;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS avg_confidence REAL DEFAULT 0.0;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS source_filename TEXT;
ALTER TABLE ocr_results ADD COLUMN IF NOT EXISTS worker_pid INTEGER;

-- Update any existing records to have default values
UPDATE ocr_results 
SET 
    extracted_text = COALESCE(original_text, ''),
    text_count = 0,
    avg_confidence = COALESCE(confidence_score, 0.0),
    source_filename = '',
    worker_pid = NULL
WHERE 
    extracted_text IS NULL 
    OR text_count IS NULL 
    OR avg_confidence IS NULL 
    OR source_filename IS NULL;