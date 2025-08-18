export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export class TextRegion {
  id?: number;
  ocr_result_id?: number;
  
  // Text content
  text: string;
  original_text?: string;
  corrected_text?: string;
  manual_text?: string;
  
  // Bounding box coordinates  
  bbox: BoundingBox;
  
  // Quality metrics
  confidence: number; // 0.0 to 1.0
  
  // Display properties
  region_index: number; // Order in the image (0-based)
  is_edited?: boolean;
  is_selected?: boolean;
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;

  static table = "text_regions";
  static columns = {
    id: "id",
    ocr_result_id: "ocr_result_id", 
    text: "text",
    original_text: "original_text",
    corrected_text: "corrected_text", 
    manual_text: "manual_text",
    bbox_x1: "bbox_x1",
    bbox_y1: "bbox_y1",
    bbox_x2: "bbox_x2", 
    bbox_y2: "bbox_y2",
    bbox_width: "bbox_width",
    bbox_height: "bbox_height",
    confidence: "confidence",
    region_index: "region_index",
    is_edited: "is_edited",
    is_selected: "is_selected",
    created_at: "created_at",
    updated_at: "updated_at"
  } as const;

  constructor(data: Partial<TextRegion & { 
    bbox_x1?: number; bbox_y1?: number; bbox_x2?: number; bbox_y2?: number;
    bbox_width?: number; bbox_height?: number;
  }> = {}) {
    this.text = data.text || '';
    this.original_text = data.original_text;
    this.corrected_text = data.corrected_text;
    this.manual_text = data.manual_text;
    this.confidence = data.confidence || 0;
    this.region_index = data.region_index || 0;
    this.is_edited = data.is_edited || false;
    this.is_selected = data.is_selected || false;

    // Handle bbox - from object or individual fields
    if (data.bbox) {
      this.bbox = data.bbox;
    } else if (data.bbox_x1 !== undefined && data.bbox_y1 !== undefined) {
      this.bbox = {
        x1: data.bbox_x1,
        y1: data.bbox_y1, 
        x2: data.bbox_x2 || 0,
        y2: data.bbox_y2 || 0,
        width: data.bbox_width || 0,
        height: data.bbox_height || 0
      };
    } else {
      this.bbox = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };
    }

    // Other fields
    if (data.id) this.id = data.id;
    if (data.ocr_result_id) this.ocr_result_id = data.ocr_result_id;
    
    // Convert string dates to Date objects
    if (typeof data.created_at === 'string') {
      this.created_at = new Date(data.created_at);
    } else if (data.created_at) {
      this.created_at = data.created_at;
    }
    
    if (typeof data.updated_at === 'string') {
      this.updated_at = new Date(data.updated_at);
    } else if (data.updated_at) {
      this.updated_at = data.updated_at;
    }
  }

  // Helper methods
  getCurrentText(): string {
    return this.manual_text || this.corrected_text || this.original_text || this.text;
  }

  hasBeenEdited(): boolean {
    return !!this.manual_text || !!this.corrected_text;
  }

  hasManualEdits(): boolean {
    return !!this.manual_text;
  }

  getConfidencePercentage(): number {
    return Math.round(this.confidence * 100);
  }

  isLowConfidence(threshold: number = 0.8): boolean {
    return this.confidence < threshold;
  }

  // Get center point of bounding box
  getCenterPoint(): { x: number; y: number } {
    return {
      x: this.bbox.x1 + this.bbox.width / 2,
      y: this.bbox.y1 + this.bbox.height / 2
    };
  }

  // Check if point is inside this region
  containsPoint(x: number, y: number): boolean {
    return x >= this.bbox.x1 && x <= this.bbox.x2 && 
           y >= this.bbox.y1 && y <= this.bbox.y2;
  }

  toJSON(): any {
    return {
      id: this.id,
      ocr_result_id: this.ocr_result_id,
      text: this.text,
      original_text: this.original_text,
      corrected_text: this.corrected_text,
      manual_text: this.manual_text,
      bbox: this.bbox,
      confidence: this.confidence,
      region_index: this.region_index,
      is_edited: this.is_edited,
      is_selected: this.is_selected,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString()
    };
  }

  // For database operations - flatten bbox
  toDatabaseRecord(): any {
    return {
      id: this.id,
      ocr_result_id: this.ocr_result_id,
      text: this.text,
      original_text: this.original_text,
      corrected_text: this.corrected_text,
      manual_text: this.manual_text,
      bbox_x1: this.bbox.x1,
      bbox_y1: this.bbox.y1,
      bbox_x2: this.bbox.x2,
      bbox_y2: this.bbox.y2,
      bbox_width: this.bbox.width,
      bbox_height: this.bbox.height,
      confidence: this.confidence,
      region_index: this.region_index,
      is_edited: this.is_edited,
      is_selected: this.is_selected,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}