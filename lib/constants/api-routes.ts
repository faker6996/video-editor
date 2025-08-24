export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    SSO_FACEBOOK: "/api/auth/sso_facebook",
    SSO_GOOGLE: "/api/auth/sso_google",
    SSO_GOOGLE_GET_TOKEN: "https://oauth2.googleapis.com/token",
    SSO_GOOGLE_GET_INFO: "https://www.googleapis.com/oauth2/v2/userinfo",
    SSO_FACEBOOK_GET_TOKEN: "https://graph.facebook.com/v12.0/oauth/access_token",
    SSO_FACEBOOK_GET_INFO: "https://graph.facebook.com/me",
  },
  ME: {
    ROLE: "/api/me/role",
  },
  OCR: {
    // Chuẩn hóa: dùng endpoint upload chung có lưu DB và phục vụ từ UPLOAD_DIR
    // Giữ key để tương thích ngược
    UPLOAD: "/api/upload/image",
    PROCESS: "/api/ocr/process",
  },
  UPLOAD: {
    IMAGE: "/api/upload/image",
    VIDEO: "/api/uploads/video",
  },
  TASKS: {
    CREATE: "/api/tasks",
    DETAIL: (id: number | string) => `/api/tasks/${id}`,
    RESULT: (id: number | string) => `/api/tasks/${id}/result`,
  },
  VIDEO_TASKS: {
    LIST: "/api/video-tasks",
    DETAIL: (id: number | string) => `/api/video-tasks/${id}`,
    VIDEOS: (id: number | string) => `/api/video-tasks/${id}/videos`,
    SUBTITLES_VI: (id: number | string) => `/api/video-tasks/${id}/subtitles/vi`,
    TTS_VI: (id: number | string) => `/api/video-tasks/${id}/tts`,
    EXPORT_VI: (id: number | string) => `/api/video-tasks/${id}/export/vi`,
    // New: Video-specific subtitle routes
    VIDEO_SUBTITLES: (taskId: number | string, videoId: number | string) => `/api/video-tasks/${taskId}/videos/${videoId}/subtitles`,
    ALL_SUBTITLES: (id: number | string) => `/api/video-tasks/${id}/all-subtitles`,
    EXPORTS: (id: number | string) => `/api/video-tasks/${id}/exports`,
  },
  VIDEOS: {
    ITEM: (id: number | string) => `/api/videos/${id}`,
    PRIMARY: (id: number | string) => `/api/videos/${id}/primary`,
  },
  SUBSCRIPTIONS: {
    PLANS: "/api/plans",
    ME: "/api/subscriptions",
  },
  SEARCH: {
    USER_NAME: (user_name: string) => `/api/search/user?user_name=${user_name}`,
  },
  RESET_PASSWORD: {
    REQUEST: `/api/forgot-password`,
    RESET: "/api/reset-password",
  },
};
