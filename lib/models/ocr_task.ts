export class OCRTask {
  id?: number;
  title?: string;
  description?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Image information
  image_url?: string;
  image_filename?: string;
  image_size?: number; // in bytes
  image_type?: string; // MIME type
  
  // Processing options
  enable_llm_correction?: boolean;
  enable_tts?: boolean;
  auto_process?: boolean;
  
  // User information
  user_id?: number;
  created_by?: string;
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  
  // Metadata
  metadata?: Record<string, any>;

  static table = "ocr_tasks";
  static columns = {
    id: "id",
    title: "title",
    description: "description",
    status: "status",
    image_url: "image_url",
    image_filename: "image_filename",
    image_size: "image_size",
    image_type: "image_type",
    enable_llm_correction: "enable_llm_correction",
    enable_tts: "enable_tts",
    auto_process: "auto_process",
    user_id: "user_id",
    created_by: "created_by",
    created_at: "created_at",
    updated_at: "updated_at",
    started_at: "started_at",
    completed_at: "completed_at",
    metadata: "metadata"
  } as const;

  constructor(data: Partial<OCRTask> = {}) {
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
      if (typeof data.started_at === 'string') {
        this.started_at = new Date(data.started_at);
      }
      if (typeof data.completed_at === 'string') {
        this.completed_at = new Date(data.completed_at);
      }
    }
  }

  // Helper methods
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isProcessing(): boolean {
    return this.status === 'processing';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  getDurationInSeconds(): number | null {
    if (this.started_at && this.completed_at) {
      return Math.floor((this.completed_at.getTime() - this.started_at.getTime()) / 1000);
    }
    return null;
  }

  getFormattedFileSize(): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (!this.image_size || this.image_size === 0) return '0 B';
    const i = Math.floor(Math.log(this.image_size) / Math.log(1024));
    return `${(this.image_size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      image_url: this.image_url,
      image_filename: this.image_filename,
      image_size: this.image_size,
      image_type: this.image_type,
      enable_llm_correction: this.enable_llm_correction,
      enable_tts: this.enable_tts,
      auto_process: this.auto_process,
      user_id: this.user_id,
      created_by: this.created_by,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      started_at: this.started_at?.toISOString(),
      completed_at: this.completed_at?.toISOString(),
      metadata: this.metadata
    };
  }
}