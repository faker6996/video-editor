export class VideoEditSettings {
  id?: number;
  video_id?: number;
  aspect_ratio?: 'original' | '16:9' | '4:3' | '1:1' | '9:16' | '21:9';
  crop?: Record<string, any>;
  filters?: Record<string, any>;
  enable_auto_subtitles?: boolean;
  enable_auto_translate?: boolean;
  target_languages?: string[];
  current_subtitle_lang?: string;
  created_at?: Date;
  updated_at?: Date;

  static table = 'video_edit_settings';
  static columns = {
    id: 'id',
    video_id: 'video_id',
    aspect_ratio: 'aspect_ratio',
    crop: 'crop',
    filters: 'filters',
    enable_auto_subtitles: 'enable_auto_subtitles',
    enable_auto_translate: 'enable_auto_translate',
    target_languages: 'target_languages',
    current_subtitle_lang: 'current_subtitle_lang',
    created_at: 'created_at',
    updated_at: 'updated_at',
  } as const;

  constructor(data: Partial<VideoEditSettings> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

