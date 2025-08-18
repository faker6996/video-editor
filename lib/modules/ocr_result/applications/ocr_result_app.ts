// Application layer for OCR Result (placeholder for use-cases)
import { ocrResultRepo } from '@/lib/modules/ocr_result/repositories/ocr_result_repo';
import { OCRResult } from '@/lib/models/ocr_result';

export const ocrResultApp = {
  async saveResult(taskId: number, result: OCRResult) {
    return ocrResultRepo.createWithRegions(taskId, result);
  }
};

