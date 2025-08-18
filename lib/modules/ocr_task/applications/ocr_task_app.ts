// Application layer for OCR Task (placeholder for orchestration/use-cases)
import { ocrTaskRepo } from '@/lib/modules/ocr_task/repositories/ocr_task_repo';
import { OCRTask } from '@/lib/models/ocr_task';

export const ocrTaskApp = {
  async getTaskWithGroup(id: number): Promise<{ task: OCRTask | null; group: OCRTask[] }>{
    const task = await ocrTaskRepo.findById(id);
    const group = task ? await ocrTaskRepo.findGroupByTaskId(id) : [];
    return { task, group };
  }
};

