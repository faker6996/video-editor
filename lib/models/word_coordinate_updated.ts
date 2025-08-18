export class WordCoordinate {
  id?: number;
  result_id?: number;
  task_id?: number;
  
  // Word information
  word?: string;
  word_index?: number; // Position in text (0-based)
  
  // Bounding box coordinates
  x?: number; // Left position
  y?: number; // Top position
  width?: number; // Width of bounding box
  height?: number; // Height of bounding box
  
  // Quality metrics
  confidence?: number; // Word-level confidence (0.000 to 1.000)
  is_corrected?: boolean; // Whether this word was corrected by LLM
  
  // Timestamps
  created_at?: Date;

  static table = "word_coordinates";
  static columns = {
    id: "id",
    result_id: "result_id",
    task_id: "task_id",
    word: "word",
    word_index: "word_index",
    x: "x",
    y: "y",
    width: "width",
    height: "height",
    confidence: "confidence",
    is_corrected: "is_corrected",
    created_at: "created_at"
  } as const;

  constructor(data: Partial<WordCoordinate> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  getConfidencePercentage(): number {
    return this.confidence ? Math.round(this.confidence * 100) : 0;
  }

  isLowConfidence(threshold: number = 0.8): boolean {
    return this.confidence ? this.confidence < threshold : true;
  }

  getConfidenceLevel(): 'high' | 'medium' | 'low' {
    if (!this.confidence) return 'low';
    if (this.confidence >= 0.9) return 'high';
    if (this.confidence >= 0.7) return 'medium';
    return 'low';
  }

  getBoundingBox(): { left: number; top: number; right: number; bottom: number } | null {
    if (!this.x || !this.y || !this.width || !this.height) return null;
    return {
      left: this.x,
      top: this.y,
      right: this.x + this.width,
      bottom: this.y + this.height
    };
  }

  getCenterPoint(): { x: number; y: number } | null {
    if (!this.x || !this.y || !this.width || !this.height) return null;
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  isWithinBounds(containerWidth: number, containerHeight: number): boolean {
    if (!this.x || !this.y || !this.width || !this.height) return false;
    return (
      this.x >= 0 &&
      this.y >= 0 &&
      this.x + this.width <= containerWidth &&
      this.y + this.height <= containerHeight
    );
  }

  // Check if this coordinate overlaps with another
  overlaps(other: WordCoordinate): boolean {
    const thisBox = this.getBoundingBox();
    const otherBox = other.getBoundingBox();
    
    if (!thisBox || !otherBox) return false;
    
    return !(
      thisBox.right < otherBox.left ||
      thisBox.left > otherBox.right ||
      thisBox.bottom < otherBox.top ||
      thisBox.top > otherBox.bottom
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      result_id: this.result_id,
      task_id: this.task_id,
      word: this.word,
      word_index: this.word_index,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      confidence: this.confidence,
      is_corrected: this.is_corrected,
      created_at: this.created_at?.toISOString()
    };
  }
}