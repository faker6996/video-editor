// components/ui/VideoUpload.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Film, File, Loader2, Check, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Button from "./Button";
import { useToast } from "./Toast";
import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { API_ROUTES } from "@/lib/constants/api-routes";

interface UploadedVideo {
  id: string;
  path: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  duration?: number;
  width?: number;
  height?: number;
  formattedSize: string;
}

interface VideoUploadProps {
  onUpload?: (video: UploadedVideo) => void;
  onRemove?: (videoId: string) => void;
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  previewSize?: "sm" | "md" | "lg";
  dragDropText?: string;
  browseText?: string;
  supportedFormatsText?: string;
}

export default function VideoUpload({
  onUpload,
  onRemove,
  maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "104857600") / (1024 * 1024), // 100MB default for videos
  accept = "video/*",
  multiple = false,
  disabled = false,
  className,
  showPreview = true,
  previewSize = "md",
  dragDropText,
  browseText,
  supportedFormatsText,
}: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Sử dụng translation cho VideoUpload
  const t = useTranslations("VideoUpload");
  const tCommon = useTranslations("Common");

  const previewSizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);

    // Reset input value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        addToast({
          type: "error",
          message: t("fileSizeError", { fileName: file.name, maxSize }),
        });
        return false;
      }

      // Check file type
      if (!file.type.startsWith("video/")) {
        addToast({
          type: "error",
          message: t("invalidFileTypeError", { fileName: file.name }),
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Upload files one by one
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await callApi<any>(API_ROUTES.UPLOAD.VIDEO, HTTP_METHOD_ENUM.POST, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newVideo: UploadedVideo = {
          id: response.id || Date.now().toString(),
          path: response.storage_path || response.path,
          url: response.url || response.storage_path,
          originalName: response.filename || file.name,
          size: file.size,
          mimeType: file.type,
          duration: response.duration,
          width: response.width,
          height: response.height,
          formattedSize: formatFileSize(file.size),
        };

        setUploadedVideos((prev) => [...prev, newVideo]);
        onUpload?.(newVideo);

        addToast({
          type: "success",
          message: t("uploadSuccess", { fileName: file.name }),
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      addToast({
        type: "error",
        message: error.message || t("uploadError"),
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRemoveVideo = (videoId: string) => {
    setUploadedVideos((prev) => prev.filter((vid) => vid.id !== videoId));
    onRemove?.(videoId);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging && !disabled
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20",
          disabled && "opacity-50 cursor-not-allowed",
          uploading && "pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm font-medium">{t("uploading")}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground">
              {isDragging ? <span className="text-primary font-medium">{t("dragDropActiveText")}</span> : dragDropText || t("dragDropText")}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              disabled={disabled || uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {browseText || t("browseText")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{supportedFormatsText || t("supportedFormatsText")}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Preview Area */}
      {showPreview && uploadedVideos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t("uploadedVideos")}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedVideos.map((video) => (
              <div key={video.id} className="relative group bg-card border border-border rounded-lg p-3">
                {/* Remove Button */}
                <Button
                  variant="danger"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => handleRemoveVideo(video.id)}
                  title={t("removeVideo")}
                >
                  <X className="w-3 h-3" />
                </Button>

                {/* Video Preview */}
                <div className={cn("mx-auto mb-2 overflow-hidden rounded-md bg-muted relative", previewSizes[previewSize])}>
                  {video.url ? (
                    <video src={video.url} className="w-full h-full object-cover" preload="metadata" title={t("videoPreview")} />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Film className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div
                    className="absolute inset-0 bg-background/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("playVideo")}
                  >
                    <Play className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-1">
                  <p className="text-xs font-medium truncate" title={video.originalName}>
                    {video.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground" title={t("fileSize")}>
                    {video.formattedSize}
                  </p>
                  {video.duration && (
                    <p className="text-xs text-muted-foreground" title={t("duration")}>
                      ⏱️ {formatDuration(video.duration)}
                    </p>
                  )}
                  {video.width && video.height && (
                    <p className="text-xs text-muted-foreground" title={t("dimensions")}>
                      📐 {video.width} × {video.height}
                    </p>
                  )}
                </div>

                {/* Success Indicator */}
                <div className="absolute top-1 left-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-success-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
