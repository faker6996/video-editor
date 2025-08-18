// OCR Editor Constants
// Task status constants
export const TASK_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

// Edit type constants
export const EDIT_TYPES = ['correction', 'addition', 'deletion', 'replacement'] as const;
export type EditType = typeof EDIT_TYPES[number];

// Edit reason constants
export const EDIT_REASONS = [
  'ocr_error', 
  'spelling_error', 
  'grammar_error', 
  'formatting', 
  'punctuation', 
  'capitalization', 
  'manual_correction', 
  'other'
] as const;
export type EditReason = typeof EDIT_REASONS[number];

// User activity type constants
export const ACTIVITY_TYPES = [
  'task_created', 
  'task_completed', 
  'task_deleted', 
  'text_edited', 
  'audio_played', 
  'results_downloaded', 
  'task_shared'
] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

// Processing step constants
export const PROCESSING_STEPS = ['upload', 'ocr', 'llm', 'tts', 'completed'] as const;
export type ProcessingStep = typeof PROCESSING_STEPS[number];

// Confidence level thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5
} as const;

// Audio format constants
export const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a'] as const;
export type AudioFormat = typeof AUDIO_FORMATS[number];

// Language code constants for TTS
export const LANGUAGE_CODES = [
  'en-US',
  'en-GB', 
  'vi-VN',
  'zh-CN',
  'ja-JP',
  'ko-KR',
  'fr-FR',
  'de-DE',
  'es-ES',
  'it-IT'
] as const;
export type LanguageCode = typeof LANGUAGE_CODES[number];

// Speech rate bounds
export const SPEECH_RATE = {
  MIN: 0.5,
  MAX: 2.0,
  DEFAULT: 1.0
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX: 10 * 1024 * 1024, // 10MB
  AUDIO_MAX: 50 * 1024 * 1024, // 50MB
} as const;

// Supported image types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
] as const;
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

// OCR Engine constants
export const OCR_ENGINES = [
  'tesseract',
  'google-vision',
  'aws-textract',
  'azure-cv',
  'paddle-ocr'
] as const;
export type OCREngine = typeof OCR_ENGINES[number];

// LLM Model constants
export const LLM_MODELS = [
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro'
] as const;
export type LLMModel = typeof LLM_MODELS[number];

// TTS Engine constants
export const TTS_ENGINES = [
  'aws-polly',
  'google-tts',
  'azure-tts',
  'elevenlabs',
  'openai-tts'
] as const;
export type TTSEngine = typeof TTS_ENGINES[number];

// Performance grade thresholds
export const PERFORMANCE_GRADES = {
  A: 90,
  B: 80,
  C: 70,
  D: 60,
  F: 0
} as const;

// Engagement level thresholds
export const ENGAGEMENT_THRESHOLDS = {
  HIGH: 15,
  MEDIUM: 8,
  LOW: 0
} as const;

// Default pagination settings
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

// API response status codes
export const API_STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500
} as const;

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 5 * 60,      // 5 minutes
  MEDIUM: 30 * 60,    // 30 minutes
  LONG: 2 * 60 * 60,  // 2 hours
  VERY_LONG: 24 * 60 * 60 // 24 hours
} as const;

// WebSocket event types
export const WS_EVENTS = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  PROCESSING_PROGRESS: 'processing_progress',
  ERROR_OCCURRED: 'error_occurred'
} as const;
export type WSEvent = typeof WS_EVENTS[keyof typeof WS_EVENTS];

// Validation rules
export const VALIDATION_RULES = {
  TASK_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255
  },
  TASK_DESCRIPTION: {
    MAX_LENGTH: 1000
  },
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  EDIT_NOTES: {
    MAX_LENGTH: 500
  }
} as const;