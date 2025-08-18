import { ActivityType, EditType, EditReason } from "@/lib/constants";
import { AudioFile } from "@/lib/models/audio_file";
import { ManualEdit } from "@/lib/models/manual_edit";
import { OCRResult } from "@/lib/models/ocr_result";
import { OCRTask } from "@/lib/models/ocr_task";
import { TaskStatistics } from "@/lib/models/task_statistics";
import { WordCoordinate } from "@/lib/models/word_coordinate";
import { WordTimestamp } from "@/lib/models/word_timestamp";

// OCR Editor Models - Export all entity classes
export { OCRTask } from "./ocr_task";
export { OCRResult } from "./ocr_result";
export { TextRegion, type BoundingBox } from "./text_region";
export { WordCoordinate } from "./word_coordinate";
export { AudioFile } from "./audio_file";
export { WordTimestamp } from "./word_timestamp";
export { ManualEdit } from "./manual_edit";
export { UserActivity } from "./user_activity";
export { TaskStatistics } from "./task_statistics";

// Re-export existing models for consistency
export { User } from "./user";

// Video Editor entities
export { VideoTask } from "./video_task";
export { Video } from "./video";
export { VideoEditSettings } from "./video_edit_settings";
export { SubtitleTrack } from "./subtitle_track";
export { SubscriptionPlan } from "./subscription_plan";
export { UserSubscription } from "./user_subscription";
export { Payment } from "./payment";
export { UserRole } from "./user_role";

// Type definitions for common interfaces used across components
export interface OCRTaskWithResults extends OCRTask {
  result?: OCRResult;
  coordinates?: WordCoordinate[];
  audioFile?: AudioFile;
  wordTimestamps?: WordTimestamp[];
  manualEdits?: ManualEdit[];
  statistics?: TaskStatistics;
}

export interface TaskProgress {
  taskId: number;
  step: "upload" | "ocr" | "llm" | "tts" | "completed";
  progress: number; // 0-100
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
}

export interface WordHighlight {
  wordIndex: number;
  isHighlighted: boolean;
  isLowConfidence?: boolean;
  isEdited?: boolean;
}

export interface AudioSyncData {
  currentTime: number;
  currentWordIndex: number | null;
  isPlaying: boolean;
  duration: number;
  playbackRate: number;
}

export interface EditSession {
  sessionId: string;
  taskId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  editsCount: number;
  wordsProcessed: number;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  averageAccuracy: number;
  totalWordsProcessed: number;
  totalEdits: number;
  averageProcessingTime: number;
  userEngagement: "high" | "medium" | "low";
}

// Utility types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Database query filters
export interface TaskFilters {
  status?: OCRTask["status"];
  userId?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  hasAudio?: boolean;
  minAccuracy?: number;
  search?: string;
}

export interface ActivityFilters {
  activityType?: ActivityType;
  userId?: number;
  taskId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Form data interfaces for create/update operations
export interface CreateTaskData {
  title: string;
  description?: string;
  imageFile: File;
  enableLLMCorrection: boolean;
  enableTTS: boolean;
  autoProcess: boolean;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: OCRTask["status"];
}

export interface CreateEditData {
  taskId: number;
  resultId: number;
  wordIndex: number;
  originalWord: string;
  editedWord: string;
  editType: EditType;
  editReason: EditReason;
  editNotes?: string;
}

// Component props interfaces
export interface OCRDisplayProps {
  imageUrl: string;
  coordinates: WordCoordinate[];
  highlightedWordIndex?: number | null;
  onWordClick?: (wordIndex: number) => void;
  showConfidence?: boolean;
  className?: string;
}

export interface AudioPlayerProps {
  audioUrl: string;
  wordTimestamps: WordTimestamp[];
  onTimeUpdate?: (wordIndex: number) => void;
  enableSpeedControl?: boolean;
  enableRepeat?: boolean;
  className?: string;
}

export interface TextEditorProps {
  initialText: string;
  wordCoordinates: WordCoordinate[];
  onTextChange?: (text: string, edits: ManualEdit[]) => void;
  enableHistory?: boolean;
  className?: string;
}

// Import constants from constants directory
export {
  TASK_STATUSES,
  EDIT_TYPES,
  EDIT_REASONS,
  ACTIVITY_TYPES,
  type TaskStatus,
  type EditType,
  type EditReason,
  type ActivityType,
} from "@/lib/constants/ocr-constants";
