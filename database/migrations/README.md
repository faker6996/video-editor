# Database Migrations

This directory contains SQL migration scripts for different database systems.

## Structure

```
migrations/
├── README.md                                    # This file
├── create_text_regions_table.sql               # SQLite version (default)
├── update_ocr_results_table.sql                # SQLite version (default)
├── postgresql/
│   ├── create_text_regions_table.sql          # PostgreSQL version
│   └── update_ocr_results_table.sql           # PostgreSQL version
└── mysql/
    ├── create_text_regions_table.sql          # MySQL version
    └── update_ocr_results_table.sql           # MySQL version
```

## Usage

Choose the appropriate migration file based on your database system:

### PostgreSQL
```bash
psql -U username -d ocr_editing -f database/migrations/postgresql/create_text_regions_table.sql
psql -U username -d ocr_editing -f database/migrations/postgresql/update_ocr_results_table.sql
```

### MySQL
```bash
mysql -u username -p ocr_editing < database/migrations/mysql/create_text_regions_table.sql
mysql -u username -p ocr_editing < database/migrations/mysql/update_ocr_results_table.sql
```

### SQLite
```bash
sqlite3 database.db < database/migrations/create_text_regions_table.sql
sqlite3 database.db < database/migrations/update_ocr_results_table.sql
```

## Migration Order

Run migrations in this order:
1. `update_ocr_results_table.sql` - Updates existing ocr_results table
2. `create_text_regions_table.sql` - Creates new text_regions table

## New Tables

### text_regions
Stores individual text regions extracted from OCR with bounding box coordinates:

- `id` - Primary key
- `ocr_result_id` - Foreign key to ocr_results table
- `text` - Current text content
- `original_text` - Original OCR text
- `corrected_text` - LLM corrected text
- `manual_text` - User manually edited text
- `bbox_x1, bbox_y1, bbox_x2, bbox_y2` - Bounding box coordinates
- `bbox_width, bbox_height` - Bounding box dimensions
- `confidence` - OCR confidence score (0.0 to 1.0)
- `region_index` - Order in the image (0-based)
- `is_edited` - Whether region has been manually edited
- `is_selected` - Whether region is currently selected in UI
- `created_at, updated_at` - Timestamps

## Updated Tables

### ocr_results
Added new columns to support updated OCR API:

- `extracted_text` - Full text extracted from OCR
- `text_count` - Number of text regions
- `avg_confidence` - Average confidence across all regions
- `source_filename` - Original image filename
- `worker_pid` - OCR service worker process ID