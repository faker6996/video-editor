export class WordTimestamp {
  id?: number;
  audio_file_id?: number;
  task_id?: number;
  
  // Word and timing information
  word?: string;
  word_index?: number; // Must match word_coordinates.word_index
  start_time?: number; // Start time in seconds
  end_time?: number; // End time in seconds
  
  // Timestamps
  created_at?: Date;

  static table = "word_timestamps";
  static columns = {
    id: "id",
    audio_file_id: "audio_file_id",
    task_id: "task_id",
    word: "word",
    word_index: "word_index",
    start_time: "start_time",
    end_time: "end_time",
    created_at: "created_at"
  } as const;

  constructor(data: Partial<WordTimestamp> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  getDuration(): number {
    if (!this.start_time || !this.end_time) return 0;
    return this.end_time - this.start_time;
  }

  getFormattedStartTime(): string {
    return this.start_time ? this.formatTime(this.start_time) : '0:00';
  }

  getFormattedEndTime(): string {
    return this.end_time ? this.formatTime(this.end_time) : '0:00';
  }

  getFormattedDuration(): string {
    return this.formatTime(this.getDuration());
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 100);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
  }

  isValidTimeRange(): boolean {
    if (!this.start_time || !this.end_time) return false;
    return this.end_time > this.start_time && this.start_time >= 0;
  }

  // Check if current time is within this word's time range
  isActiveAt(currentTime: number): boolean {
    if (!this.start_time || !this.end_time) return false;
    return currentTime >= this.start_time && currentTime <= this.end_time;
  }

  // Check if this timestamp overlaps with another
  overlaps(other: WordTimestamp): boolean {
    if (!this.start_time || !this.end_time || !other.start_time || !other.end_time) return false;
    return !(this.end_time <= other.start_time || this.start_time >= other.end_time);
  }

  toJSON(): any {
    return {
      id: this.id,
      audio_file_id: this.audio_file_id,
      task_id: this.task_id,
      word: this.word,
      word_index: this.word_index,
      start_time: this.start_time,
      end_time: this.end_time,
      created_at: this.created_at?.toISOString()
    };
  }
}