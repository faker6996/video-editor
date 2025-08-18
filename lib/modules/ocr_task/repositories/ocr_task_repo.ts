import { OCRTask } from '@/lib/models/ocr_task';
import { safeQuery } from '@/lib/modules/common/safe_query';
import { baseRepo } from '@/lib/modules/common/base_repo';

export const ocrTaskRepo = {
  async create(data: Partial<OCRTask>): Promise<OCRTask> {
    const now = new Date();
    const payload = new OCRTask({
      ...data,
      status: data.status ?? 'pending',
      created_at: data.created_at ?? now,
      updated_at: data.updated_at ?? now,
    });
    const inserted = await baseRepo.insert<OCRTask>(payload);
    return new OCRTask(inserted);
  },

  async findById(id: number): Promise<OCRTask | null> {
    const found = await baseRepo.getById<OCRTask>(OCRTask, id);
    return found ? new OCRTask(found) : null;
  },

  async updateStatus(id: number, status: OCRTask['status']): Promise<OCRTask | null> {
    const updated = await baseRepo.update<OCRTask>(new OCRTask({ id, status, updated_at: new Date() }));
    return updated ? new OCRTask(updated) : null;
  },

  async markStarted(id: number): Promise<OCRTask | null> {
    const updated = await baseRepo.update<OCRTask>(new OCRTask({ id, status: 'processing', started_at: new Date(), updated_at: new Date() }));
    return updated ? new OCRTask(updated) : null;
  },

  async markCompleted(id: number): Promise<OCRTask | null> {
    const updated = await baseRepo.update<OCRTask>(new OCRTask({ id, status: 'completed', completed_at: new Date(), updated_at: new Date() }));
    return updated ? new OCRTask(updated) : null;
  },

  async markFailed(id: number): Promise<OCRTask | null> {
    const updated = await baseRepo.update<OCRTask>(new OCRTask({ id, status: 'failed', updated_at: new Date() }));
    return updated ? new OCRTask(updated) : null;
  },

  async findGroupByTaskId(id: number): Promise<OCRTask[]> {
    const task = await this.findById(id);
    const groupId = (task as any)?.metadata?.group_id;
    if (!groupId) return task ? [task] : [];
    const rows = await baseRepo.findManyByJsonbKeyEq<OCRTask>(OCRTask as any, 'metadata' as any, 'group_id', groupId, {
      orderBy: ['id'] as any,
      orderDirections: { id: 'ASC' } as any,
      allowedOrderFields: ['id', 'created_at'] as any
    });
    return rows.map((r: any) => new OCRTask(r));
  }
};
