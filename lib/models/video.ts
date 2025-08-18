export class Video {
  id?: number;
  task_id?: number;
  user_id?: number;
  source_url?: string;
  storage_path?: string;
  filename?: string;
  size_bytes?: number;
  format?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  audio_channels?: number;
  language_code?: string;
  is_primary?: boolean;
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;

  static table = 'videos';
  static columns = {
    id: 'id',
    task_id: 'task_id',
    user_id: 'user_id',
    source_url: 'source_url',
    storage_path: 'storage_path',
    filename: 'filename',
    size_bytes: 'size_bytes',
    format: 'format',
    duration_seconds: 'duration_seconds',
    width: 'width',
    height: 'height',
    fps: 'fps',
    audio_channels: 'audio_channels',
    language_code: 'language_code',
    is_primary: 'is_primary',
    created_at: 'created_at',
    updated_at: 'updated_at',
    metadata: 'metadata',
  } as const;

  constructor(data: Partial<Video> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
      if (typeof data.duration_seconds === 'string') this.duration_seconds = Number(data.duration_seconds);
      if (typeof data.fps === 'string') this.fps = Number(data.fps);
    }
  }
}
