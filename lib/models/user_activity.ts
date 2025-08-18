import { type ActivityType } from '@/lib/constants/ocr-constants';

export class UserActivity {
  id: number = 0;
  user_id: number = 0;
  username: string = '';
  
  // Activity information
  activity_type: ActivityType = 'task_created';
  task_id?: number;
  
  // Activity details
  details: Record<string, any> = {}; // Flexible storage for activity-specific data
  duration_seconds?: number; // Time spent on activity
  
  // Performance metrics
  accuracy_achieved?: number; // User's accuracy for this activity
  words_processed?: number; // Number of words processed
  edits_made: number = 0; // Number of edits made
  
  // Session information
  session_id?: string; // Browser/app session ID
  ip_address?: string; // User's IP address
  user_agent?: string; // Browser/app user agent
  
  // Timestamps
  created_at: Date = new Date();

  constructor(data?: Partial<UserActivity>) {
    if (data) {
      Object.assign(this, data);
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  getActivityLabel(): string {
    const activityLabels: Record<ActivityType, string> = {
      'task_created': 'Task Created',
      'task_completed': 'Task Completed',
      'task_deleted': 'Task Deleted',
      'text_edited': 'Text Edited',
      'audio_played': 'Audio Played',
      'results_downloaded': 'Results Downloaded',
      'task_shared': 'Task Shared'
    };
    return activityLabels[this.activity_type];
  }

  getFormattedDuration(): string {
    if (!this.duration_seconds) return 'N/A';
    
    if (this.duration_seconds < 60) {
      return `${this.duration_seconds}s`;
    }
    
    const minutes = Math.floor(this.duration_seconds / 60);
    const seconds = this.duration_seconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  getAccuracyPercentage(): string {
    return this.accuracy_achieved ? `${this.accuracy_achieved.toFixed(1)}%` : 'N/A';
  }

  isProductiveActivity(): boolean {
    return ['task_created', 'task_completed', 'text_edited'].includes(this.activity_type);
  }

  isViewActivity(): boolean {
    return ['audio_played', 'results_downloaded', 'task_shared'].includes(this.activity_type);
  }

  hasPerformanceMetrics(): boolean {
    return !!(this.accuracy_achieved || this.words_processed || this.edits_made > 0);
  }

  getTimeAgo(): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - this.created_at.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    
    return this.created_at.toLocaleDateString();
  }

  getBrowserInfo(): { name: string; version: string } | null {
    if (!this.user_agent) return null;
    
    // Simple browser detection
    const ua = this.user_agent.toLowerCase();
    if (ua.includes('chrome')) return { name: 'Chrome', version: 'Unknown' };
    if (ua.includes('firefox')) return { name: 'Firefox', version: 'Unknown' };
    if (ua.includes('safari')) return { name: 'Safari', version: 'Unknown' };
    if (ua.includes('edge')) return { name: 'Edge', version: 'Unknown' };
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  getSessionDuration(): number | null {
    // This would need to be calculated based on session activities
    // For now, return the activity duration if available
    return this.duration_seconds || null;
  }

  // Get activity icon name for UI
  getIconName(): string {
    const iconMap: Record<ActivityType, string> = {
      'task_created': 'plus-circle',
      'task_completed': 'check-circle',
      'task_deleted': 'trash-2',
      'text_edited': 'edit',
      'audio_played': 'play-circle',
      'results_downloaded': 'download',
      'task_shared': 'share'
    };
    return iconMap[this.activity_type];
  }

  // Get activity color for UI
  getActivityColor(): string {
    const colorMap: Record<ActivityType, string> = {
      'task_created': 'blue',
      'task_completed': 'green',
      'task_deleted': 'red',
      'text_edited': 'orange',
      'audio_played': 'purple',
      'results_downloaded': 'indigo',
      'task_shared': 'pink'
    };
    return colorMap[this.activity_type];
  }

  // Extract specific detail from the details object
  getDetail(key: string): any {
    return this.details[key];
  }

  // Check if activity has specific detail
  hasDetail(key: string): boolean {
    return key in this.details && this.details[key] != null;
  }

  toJSON(): any {
    return {
      id: this.id,
      user_id: this.user_id,
      username: this.username,
      activity_type: this.activity_type,
      task_id: this.task_id,
      details: this.details,
      duration_seconds: this.duration_seconds,
      accuracy_achieved: this.accuracy_achieved,
      words_processed: this.words_processed,
      edits_made: this.edits_made,
      session_id: this.session_id,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      created_at: this.created_at.toISOString()
    };
  }
}