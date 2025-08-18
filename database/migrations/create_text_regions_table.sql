CREATE TABLE IF NOT EXISTS text_regions (
    id SERIAL PRIMARY KEY,
    ocr_result_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    original_text TEXT,
    corrected_text TEXT,
    manual_text TEXT,
    bbox_x1 INTEGER NOT NULL,
    bbox_y1 INTEGER NOT NULL,
    bbox_x2 INTEGER NOT NULL,
    bbox_y2 INTEGER NOT NULL,
    bbox_width INTEGER NOT NULL,
    bbox_height INTEGER NOT NULL,
    confidence REAL NOT NULL DEFAULT 0.0,
    region_index INTEGER NOT NULL DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_text_regions_ocr_result_id 
        FOREIGN KEY (ocr_result_id) 
        REFERENCES ocr_results(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_confidence_range 
        CHECK (confidence >= 0.0 AND confidence <= 1.0),
    CONSTRAINT chk_bbox_positive 
        CHECK (bbox_x1 >= 0 AND bbox_y1 >= 0),
    CONSTRAINT chk_bbox_valid 
        CHECK (bbox_x2 >= bbox_x1 AND bbox_y2 >= bbox_y1),
    CONSTRAINT chk_bbox_dimensions 
        CHECK (bbox_width >= 0 AND bbox_height >= 0)
);