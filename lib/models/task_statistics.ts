export class TaskStatistics {
  id: number = 0;
  task_id: number = 0;
  user_id: number = 0;
  
  // Processing statistics
  total_processing_time_seconds: number = 0;
  ocr_processing_time_seconds: number = 0;
  llm_processing_time_seconds: number = 0;
  tts_processing_time_seconds: number = 0;
  
  // Quality statistics
  original_word_count: number = 0;
  corrected_word_count: number = 0;
  manually_edited_word_count: number = 0;
  final_accuracy_percentage?: number;
  improvement_percentage?: number; // Improvement from original to final
  
  // User interaction statistics
  total_edit_sessions: number = 0;
  total_time_spent_seconds: number = 0;
  audio_play_count: number = 0;
  download_count: number = 0;
  share_count: number = 0;
  
  // Performance metrics
  words_per_minute?: number; // Editing speed
  error_rate?: number; // Edit error rate
  efficiency_score?: number; // Overall efficiency score
  
  // Timestamps
  created_at: Date = new Date();
  updated_at: Date = new Date();

  constructor(data?: Partial<TaskStatistics>) {
    if (data) {
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
  getTotalProcessingTimeFormatted(): string {
    return this.formatTime(this.total_processing_time_seconds);
  }

  getOCRProcessingTimeFormatted(): string {
    return this.formatTime(this.ocr_processing_time_seconds);
  }

  getLLMProcessingTimeFormatted(): string {
    return this.formatTime(this.llm_processing_time_seconds);
  }

  getTTSProcessingTimeFormatted(): string {
    return this.formatTime(this.tts_processing_time_seconds);
  }

  getTotalTimeSpentFormatted(): string {
    return this.formatTime(this.total_time_spent_seconds);
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  // Calculate edit rate percentage
  getEditRate(): number {
    if (this.original_word_count === 0) return 0;
    return (this.manually_edited_word_count / this.original_word_count) * 100;
  }

  // Calculate correction rate percentage
  getCorrectionRate(): number {
    if (this.original_word_count === 0) return 0;
    return (this.corrected_word_count / this.original_word_count) * 100;
  }

  // Get processing efficiency (words per second)
  getProcessingEfficiency(): number {
    if (this.total_processing_time_seconds === 0) return 0;
    return this.original_word_count / this.total_processing_time_seconds;
  }

  // Get edit efficiency (edits per minute during editing sessions)
  getEditEfficiency(): number {
    if (this.total_time_spent_seconds === 0) return 0;
    return (this.manually_edited_word_count / this.total_time_spent_seconds) * 60;
  }

  // Check if task has significant improvements
  hasSignificantImprovement(): boolean {
    return !!(this.improvement_percentage && this.improvement_percentage > 5);
  }

  // Get overall performance grade
  getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (!this.efficiency_score) return 'F';
    
    if (this.efficiency_score >= 90) return 'A';
    if (this.efficiency_score >= 80) return 'B';
    if (this.efficiency_score >= 70) return 'C';
    if (this.efficiency_score >= 60) return 'D';
    return 'F';
  }

  // Check if user is active (multiple interactions)
  isActiveUser(): boolean {
    return this.total_edit_sessions > 1 || 
           this.audio_play_count > 2 || 
           this.total_time_spent_seconds > 300; // 5 minutes
  }

  // Get engagement level
  getEngagementLevel(): 'high' | 'medium' | 'low' {
    const engagementScore = 
      (this.total_edit_sessions * 2) +
      (this.audio_play_count * 1) +
      (this.download_count * 3) +
      (this.share_count * 5);
    
    if (engagementScore >= 15) return 'high';
    if (engagementScore >= 8) return 'medium';
    return 'low';
  }

  // Calculate time breakdown percentages
  getProcessingTimeBreakdown(): {
    ocr: number;
    llm: number;
    tts: number;
    other: number;
  } {
    if (this.total_processing_time_seconds === 0) {
      return { ocr: 0, llm: 0, tts: 0, other: 0 };
    }
    
    const total = this.total_processing_time_seconds;
    const accounted = this.ocr_processing_time_seconds + 
                     this.llm_processing_time_seconds + 
                     this.tts_processing_time_seconds;
    
    return {
      ocr: (this.ocr_processing_time_seconds / total) * 100,
      llm: (this.llm_processing_time_seconds / total) * 100,
      tts: (this.tts_processing_time_seconds / total) * 100,
      other: ((total - accounted) / total) * 100
    };
  }

  // Get quality metrics summary
  getQualityMetrics(): {
    accuracy: number;
    improvement: number;
    editRate: number;
    correctionRate: number;
  } {
    return {
      accuracy: this.final_accuracy_percentage || 0,
      improvement: this.improvement_percentage || 0,
      editRate: this.getEditRate(),
      correctionRate: this.getCorrectionRate()
    };
  }

  // Check if statistics are complete
  isComplete(): boolean {
    return !!(
      this.final_accuracy_percentage &&
      this.total_processing_time_seconds > 0 &&
      this.original_word_count > 0
    );
  }

  toJSON(): any {
    return {
      id: this.id,
      task_id: this.task_id,
      user_id: this.user_id,
      total_processing_time_seconds: this.total_processing_time_seconds,
      ocr_processing_time_seconds: this.ocr_processing_time_seconds,
      llm_processing_time_seconds: this.llm_processing_time_seconds,
      tts_processing_time_seconds: this.tts_processing_time_seconds,
      original_word_count: this.original_word_count,
      corrected_word_count: this.corrected_word_count,
      manually_edited_word_count: this.manually_edited_word_count,
      final_accuracy_percentage: this.final_accuracy_percentage,
      improvement_percentage: this.improvement_percentage,
      total_edit_sessions: this.total_edit_sessions,
      total_time_spent_seconds: this.total_time_spent_seconds,
      audio_play_count: this.audio_play_count,
      download_count: this.download_count,
      share_count: this.share_count,
      words_per_minute: this.words_per_minute,
      error_rate: this.error_rate,
      efficiency_score: this.efficiency_score,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
}