export class VideoTask {
  id?: number;
  user_id?: number;
  title?: string;
  description?: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;

  static table = 'video_tasks';
  static columns = {
    id: 'id',
    user_id: 'user_id',
    title: 'title',
    description: 'description',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    metadata: 'metadata',
  } as const;

  constructor(data: Partial<VideoTask> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

