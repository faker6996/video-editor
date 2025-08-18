import { OCRResult } from '@/lib/models/ocr_result';
import { TextRegion } from '@/lib/models/text_region';
import { baseRepo } from '@/lib/modules/common/base_repo';

export const ocrResultRepo = {
  async createWithRegions(taskId: number, result: OCRResult): Promise<{ result: OCRResult; regionCount: number }>{
    const now = new Date();
    const data = new OCRResult({
      task_id: taskId,
      extracted_text: result.extracted_text,
      original_text: result.original_text ?? result.extracted_text ?? '',
      corrected_text: result.corrected_text,
      final_text: result.final_text,
      text_count: result.text_count,
      avg_confidence: result.avg_confidence,
      confidence_score: result.confidence_score,
      accuracy_percentage: result.accuracy_percentage,
      total_words: result.total_words,
      low_confidence_words: result.low_confidence_words,
      source_filename: result.source_filename,
      ocr_engine: result.ocr_engine,
      llm_model: result.llm_model,
      processing_time_seconds: result.processing_time_seconds,
      worker_pid: result.worker_pid,
      created_at: now,
      updated_at: now,
    });

    // Use BaseRepo for inserting ocr_results
    const created = await baseRepo.insert<OCRResult>(data);
    if (!created.id) {
      throw new Error('Failed to create OCR result: no ID returned from database');
    }
    const resultId: number = created.id;

    const regions = result.getTextRegions();
    if (regions.length) {
      // Use BaseRepo.insertMany with a lightweight DB record class
      class TextRegionDbRecord {
        static table = 'text_regions';
        id?: number;
        ocr_result_id!: number;
        text!: string;
        original_text?: string | null;
        corrected_text?: string | null;
        manual_text?: string | null;
        bbox_x1!: number; bbox_y1!: number; bbox_x2!: number; bbox_y2!: number; bbox_width!: number; bbox_height!: number;
        confidence!: number;
        region_index!: number;
        is_edited?: boolean;
        is_selected?: boolean;
        created_at?: Date;
        updated_at?: Date;
        constructor(fields: Partial<TextRegionDbRecord>) { Object.assign(this, fields); }
      }

      const records = regions.map((reg) => {
        const r = reg instanceof TextRegion ? reg : new TextRegion(reg);
        return new TextRegionDbRecord({
          ocr_result_id: resultId,
          text: r.text,
          original_text: r.original_text ?? r.text,
          corrected_text: r.corrected_text ?? null,
          manual_text: r.manual_text ?? null,
          bbox_x1: r.bbox.x1,
          bbox_y1: r.bbox.y1,
          bbox_x2: r.bbox.x2,
          bbox_y2: r.bbox.y2,
          bbox_width: r.bbox.width,
          bbox_height: r.bbox.height,
          confidence: r.confidence,
          region_index: r.region_index ?? 0,
          is_edited: !!r.is_edited,
          is_selected: !!r.is_selected,
          created_at: now,
          updated_at: now
        });
      });

      await baseRepo.insertMany<TextRegionDbRecord>(records);
    }

    return { result: new OCRResult(created), regionCount: regions.length };
  }
  ,
  async findLatestByTaskIdWithRegions(taskId: number): Promise<{ result: OCRResult | null; regions: TextRegion[] }>{
    const results = await baseRepo.findManyByFields<OCRResult>(OCRResult as any, { task_id: taskId } as any, {
      orderBy: ['created_at', 'id'] as any,
      orderDirections: { created_at: 'DESC', id: 'DESC' } as any,
      allowedOrderFields: ['created_at', 'id'] as any
    });
    const result = results[0] ? new OCRResult(results[0] as any) : null;
    if (!result || !result.id) return { result: null, regions: [] };
    const regionRows = await baseRepo.findManyByFields<TextRegion>(TextRegion as any, { ocr_result_id: result.id } as any, {
      orderBy: ['region_index', 'id'] as any,
      orderDirections: { region_index: 'ASC', id: 'ASC' } as any,
      allowedOrderFields: ['region_index', 'id', 'created_at'] as any
    });
    const regions = regionRows.map(r => new TextRegion(r as any));
    return { result, regions };
  }
};
