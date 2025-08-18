import { TextRegion } from './text_region';

export class OCRResult {
  id?: number;
  task_id?: number;
  
  // Text results - extracted from API
  extracted_text?: string; // Full extracted text from OCR
  original_text?: string;  // For backward compatibility
  corrected_text?: string;
  final_text?: string;
  
  // Quality metrics
  text_count?: number; // Number of text regions
  avg_confidence?: number; // Average confidence (0.0 to 1.0)
  confidence_score?: number; // For backward compatibility
  accuracy_percentage?: number; // Calculated accuracy percentage
  total_words?: number;
  low_confidence_words?: number;
  
  // Processing information
  source_filename?: string; // Original filename
  ocr_engine?: string; // OCR engine used
  llm_model?: string; // LLM model used for correction
  processing_time_seconds?: number; // Total processing time
  worker_pid?: number; // Worker process ID
  
  // Text regions data
  text_regions?: TextRegion[];
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;

  static table = "ocr_results";
  static columns = {
    id: "id",
    task_id: "task_id",
    extracted_text: "extracted_text",
    original_text: "original_text",
    corrected_text: "corrected_text",
    final_text: "final_text",
    text_count: "text_count",
    avg_confidence: "avg_confidence",
    confidence_score: "confidence_score",
    accuracy_percentage: "accuracy_percentage",
    total_words: "total_words",
    low_confidence_words: "low_confidence_words",
    source_filename: "source_filename",
    ocr_engine: "ocr_engine",
    llm_model: "llm_model",
    processing_time_seconds: "processing_time_seconds",
    worker_pid: "worker_pid",
    created_at: "created_at",
    updated_at: "updated_at"
  } as const;

  constructor(data: Partial<OCRResult> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
      // Convert text_regions array if provided
      if (data.text_regions && Array.isArray(data.text_regions)) {
        this.text_regions = data.text_regions.map(region => 
          region instanceof TextRegion ? region : new TextRegion(region)
        );
      }
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
      if (typeof data.updated_at === 'string') {
        this.updated_at = new Date(data.updated_at);
      }
    }
  }

  // Helper methods
  hasCorrection(): boolean {
    return !!this.corrected_text && this.corrected_text !== this.original_text;
  }

  hasManualEdits(): boolean {
    return !!this.final_text && this.final_text !== (this.corrected_text || this.original_text);
  }

  getConfidencePercentage(): number {
    return this.confidence_score ? Math.round(this.confidence_score * 100) : 0;
  }

  getLowConfidenceRate(): number {
    const totalWords = this.total_words || 0;
    const lowConfidenceWords = this.low_confidence_words || 0;
    return totalWords > 0 ? (lowConfidenceWords / totalWords) * 100 : 0;
  }

  getProcessingTimeFormatted(): string {
    if (!this.processing_time_seconds) return 'N/A';
    const minutes = Math.floor(this.processing_time_seconds / 60);
    const seconds = this.processing_time_seconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  getCurrentText(): string {
    return this.final_text || this.corrected_text || this.original_text || this.extracted_text || '';
  }

  // New helper methods for text regions
  getTextRegions(): TextRegion[] {
    return this.text_regions || [];
  }

  getTextRegionByIndex(index: number): TextRegion | null {
    return this.text_regions?.[index] || null;
  }

  getTotalRegions(): number {
    return this.text_count || this.text_regions?.length || 0;
  }

  getAverageConfidencePercentage(): number {
    return this.avg_confidence ? Math.round(this.avg_confidence * 100) : 0;
  }

  getLowConfidenceRegions(threshold: number = 0.8): TextRegion[] {
    return this.getTextRegions().filter(region => region.confidence < threshold);
  }

  getEditedRegions(): TextRegion[] {
    return this.getTextRegions().filter(region => region.hasBeenEdited());
  }

  // Create OCRResult from API response
  static fromApiResponse(apiData: any): OCRResult {
    const result = apiData.results?.[0];
    if (!result) {
      throw new Error('Invalid API response: no results found');
    }

    const ocrResult = new OCRResult({
      extracted_text: result.extracted_text,
      text_count: result.text_count,
      avg_confidence: result.avg_confidence,
      processing_time_seconds: apiData.processing_info?.processing_time_seconds,
      source_filename: apiData.processing_info?.source,
      worker_pid: apiData.processing_info?.worker_pid,
      created_at: new Date()
    });

    // Convert text_regions
    if (result.text_regions) {
      ocrResult.text_regions = result.text_regions.map((region: any, index: number) => 
        new TextRegion({
          text: region.text,
          original_text: region.text,
          bbox: region.bbox,
          confidence: region.confidence,
          region_index: index
        })
      );
    }

    return ocrResult;
  }

  toJSON(): any {
    return {
      id: this.id,
      task_id: this.task_id,
      extracted_text: this.extracted_text,
      original_text: this.original_text,
      corrected_text: this.corrected_text,
      final_text: this.final_text,
      text_count: this.text_count,
      avg_confidence: this.avg_confidence,
      confidence_score: this.confidence_score,
      accuracy_percentage: this.accuracy_percentage,
      total_words: this.total_words,
      low_confidence_words: this.low_confidence_words,
      source_filename: this.source_filename,
      ocr_engine: this.ocr_engine,
      llm_model: this.llm_model,
      processing_time_seconds: this.processing_time_seconds,
      worker_pid: this.worker_pid,
      text_regions: this.text_regions?.map(region => region.toJSON()),
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString()
    };
  }
}