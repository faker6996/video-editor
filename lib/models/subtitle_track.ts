export class SubtitleTrack {
  id?: number;
  video_id?: number;
  language_code?: string;
  storage_path?: string;
  url?: string;
  format?: 'srt' | 'vtt';
  is_auto_generated?: boolean;
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;

  static table = 'subtitle_tracks';
  static columns = {
    id: 'id',
    video_id: 'video_id',
    language_code: 'language_code',
    storage_path: 'storage_path',
    url: 'url',
    format: 'format',
    is_auto_generated: 'is_auto_generated',
    created_at: 'created_at',
    updated_at: 'updated_at',
    metadata: 'metadata',
  } as const;

  constructor(data: Partial<SubtitleTrack> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

