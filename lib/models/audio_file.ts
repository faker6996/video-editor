export class AudioFile {
  id?: number;
  task_id?: number;
  result_id?: number;
  
  // Audio file information
  audio_url?: string;
  audio_filename?: string;
  audio_size?: number; // File size in bytes
  audio_format?: string; // Audio format (mp3, wav, etc.)
  duration_seconds?: number; // Audio duration
  
  // TTS information
  tts_engine?: string; // TTS engine used
  voice_model?: string; // Voice model used
  language_code?: string;
  speech_rate?: number; // Speech rate (0.5 to 2.0)
  
  // Processing information
  generation_time_seconds?: number; // Time to generate audio
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;

  static table = "audio_files";
  static columns = {
    id: "id",
    task_id: "task_id",
    result_id: "result_id",
    audio_url: "audio_url",
    audio_filename: "audio_filename",
    audio_size: "audio_size",
    audio_format: "audio_format",
    duration_seconds: "duration_seconds",
    tts_engine: "tts_engine",
    voice_model: "voice_model",
    language_code: "language_code",
    speech_rate: "speech_rate",
    generation_time_seconds: "generation_time_seconds",
    created_at: "created_at",
    updated_at: "updated_at"
  } as const;

  constructor(data: Partial<AudioFile> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
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
  getFormattedFileSize(): string {
    if (!this.audio_size) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (this.audio_size === 0) return '0 B';
    const i = Math.floor(Math.log(this.audio_size) / Math.log(1024));
    return `${(this.audio_size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  getFormattedDuration(): string {
    if (!this.duration_seconds) return '0:00';
    const minutes = Math.floor(this.duration_seconds / 60);
    const seconds = Math.floor(this.duration_seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getGenerationTimeFormatted(): string {
    if (!this.generation_time_seconds) return 'N/A';
    return this.generation_time_seconds < 60 
      ? `${this.generation_time_seconds}s`
      : `${Math.floor(this.generation_time_seconds / 60)}m ${this.generation_time_seconds % 60}s`;
  }

  isValidSpeechRate(): boolean {
    return this.speech_rate !== undefined && this.speech_rate >= 0.5 && this.speech_rate <= 2.0;
  }

  getSpeechRateLabel(): string {
    if (!this.speech_rate) return 'Unknown';
    if (this.speech_rate < 0.8) return 'Slow';
    if (this.speech_rate > 1.2) return 'Fast';
    return 'Normal';
  }

  getAudioFormat(): string {
    return this.audio_format?.toUpperCase() || 'UNKNOWN';
  }

  isMP3(): boolean {
    return this.audio_format?.toLowerCase() === 'mp3';
  }

  isWAV(): boolean {
    return this.audio_format?.toLowerCase() === 'wav';
  }

  getLanguageLabel(): string {
    const languageMap: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'vi-VN': 'Vietnamese',
      'zh-CN': 'Chinese (Simplified)',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'it-IT': 'Italian'
    };
    return this.language_code ? (languageMap[this.language_code] || this.language_code) : 'Unknown';
  }

  toJSON(): any {
    return {
      id: this.id,
      task_id: this.task_id,
      result_id: this.result_id,
      audio_url: this.audio_url,
      audio_filename: this.audio_filename,
      audio_size: this.audio_size,
      audio_format: this.audio_format,
      duration_seconds: this.duration_seconds,
      tts_engine: this.tts_engine,
      voice_model: this.voice_model,
      language_code: this.language_code,
      speech_rate: this.speech_rate,
      generation_time_seconds: this.generation_time_seconds,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString()
    };
  }
}