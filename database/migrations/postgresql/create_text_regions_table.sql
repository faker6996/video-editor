-- Migration: Create text_regions table for PostgreSQL
-- Purpose: Store individual text regions from OCR results with bounding box coordinates

CREATE TABLE IF NOT EXISTS text_regions (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to ocr_results
    ocr_result_id INTEGER NOT NULL,
    
    -- Text content
    text TEXT NOT NULL,
    original_text TEXT, -- Original OCR text before any corrections
    corrected_text TEXT, -- LLM corrected text  
    manual_text TEXT,   -- Manually edited text by user
    
    -- Bounding box coordinates (pixels)
    bbox_x1 INTEGER NOT NULL,  -- Left coordinate
    bbox_y1 INTEGER NOT NULL,  -- Top coordinate  
    bbox_x2 INTEGER NOT NULL,  -- Right coordinate
    bbox_y2 INTEGER NOT NULL,  -- Bottom coordinate
    bbox_width INTEGER NOT NULL,  -- Width of bounding box
    bbox_height INTEGER NOT NULL, -- Height of bounding box
    
    -- Quality metrics
    confidence REAL NOT NULL DEFAULT 0.0, -- OCR confidence (0.0 to 1.0)
    
    -- Display properties
    region_index INTEGER NOT NULL DEFAULT 0, -- Order in the image (0-based)
    is_edited BOOLEAN DEFAULT FALSE,  -- Has been manually edited
    is_selected BOOLEAN DEFAULT FALSE, -- Currently selected in UI
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (ocr_result_id) REFERENCES ocr_results(id) ON DELETE CASCADE,
    CHECK (confidence >= 0.0 AND confidence <= 1.0),
    CHECK (bbox_x1 >= 0 AND bbox_y1 >= 0),
    CHECK (bbox_x2 >= bbox_x1 AND bbox_y2 >= bbox_y1),
    CHECK (bbox_width >= 0 AND bbox_height >= 0)
);

-- Indexes for performance (PostgreSQL doesn't support IF NOT EXISTS on indexes)
CREATE INDEX idx_text_regions_ocr_result_id ON text_regions(ocr_result_id);
CREATE INDEX idx_text_regions_region_index ON text_regions(region_index);
CREATE INDEX idx_text_regions_confidence ON text_regions(confidence);
CREATE INDEX idx_text_regions_is_edited ON text_regions(is_edited);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_text_regions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_text_regions_timestamp ON text_regions;
CREATE TRIGGER update_text_regions_timestamp
    BEFORE UPDATE ON text_regions
    FOR EACH ROW
    EXECUTE FUNCTION update_text_regions_timestamp();