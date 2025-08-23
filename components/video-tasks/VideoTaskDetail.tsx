"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
// import { Form, FormSubmitButton, FormField } from "@/components/ui/Form"; // Unused after manual file upload fix
import { useTranslations } from "next-intl";
import VideoPlayer from "@/components/video/VideoPlayer";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { Combobox } from "@/components/ui/Combobox";
import { Checkbox } from "@/components/ui/CheckBox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";

interface Video {
  id: number;
  source_url?: string;
  filename?: string;
  format?: string;
  duration_seconds?: number;
  is_primary?: boolean;
  created_at?: string;
}

export default function VideoTaskDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const t = useTranslations("Common");
  const [meta, setMeta] = useState<{ title?: string; description?: string; status?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>(undefined);
  const [ttsUrl, setTtsUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | undefined>(undefined);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subtitleLoading, setSubtitleLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [allSubtitles, setAllSubtitles] = useState<any[]>([]);

  // Export options
  const [includeSubtitle, setIncludeSubtitle] = useState(true);
  const [includeTTS, setIncludeTTS] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<"normal" | "karaoke">("normal");
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(false);
  const [ttsVoice, setTtsVoice] = useState<string>("alloy");
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | undefined>(undefined);
  const [autoSpeed, setAutoSpeed] = useState<number>(1.0);

  const load = () => {
    // Load videos
    callApi<any[]>(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "GET", undefined, { silent: true })
      .then((arr) => {
        setVideos(arr);
        const primary = arr.find((v: any) => v.is_primary) || arr[0];
        if (primary) {
          if (primary.storage_path) {
            // Normalize path - storage_path already has /uploads/ prefix
            // storage_path format: "/uploads/origin_videos/..."
            // Now serve directly from public: "/uploads/origin_videos/..."
            const videoUrl = primary.storage_path.startsWith("/uploads/")
              ? primary.storage_path // Direct static serve from public/uploads
              : `/uploads/${primary.storage_path}`;
            setVideoUrl(videoUrl);
            console.log(`🎥 Video URL set: ${videoUrl}`);
          } else {
            setVideoUrl(primary.source_url);
            console.log(`🌐 Video URL set from source: ${primary.source_url}`);
          }
        }
      })
      .catch(() => setVideos([]));

    // Load task metadata
    callApi(API_ROUTES.VIDEO_TASKS.DETAIL(id as string), "GET", undefined, { silent: true })
      .then((res) => setMeta((res as any) || null))
      .catch(() => setMeta(null));

    // Load all subtitles for the task
    callApi(API_ROUTES.VIDEO_TASKS.ALL_SUBTITLES(id as string), "GET", undefined, { silent: true })
      .then((res: any) => {
        const subs = res?.videos || [];
        setAllSubtitles(subs);
        
        // Calculate optimal TTS speed based on subtitle timing
        if (subs && subs.length > 0) {
          calculateOptimalTTSSpeed(subs).then(optimalSpeed => {
            console.log(`🎯 Calculated optimal TTS speed: ${optimalSpeed}x`);
            setAutoSpeed(optimalSpeed);
          }).catch(error => {
            console.error('❌ Failed to calculate TTS speed:', error);
            setAutoSpeed(1.3); // Default faster speed
          });
        }
      })
      .catch(() => setAllSubtitles([]));
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onAdd = async () => {
    console.log("🎬 onAdd clicked", { id, sourceUrl, filename });
    if (!id || !sourceUrl.trim()) {
      console.log("⚠️ Missing id or sourceUrl", { id, sourceUrl });
      return;
    }
    setLoading(true);
    try {
      console.log("📡 Calling API:", API_ROUTES.VIDEO_TASKS.VIDEOS(id as string));
      await callApi(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "POST", { source_url: sourceUrl, filename });
      setSourceUrl("");
      setFilename("");
      load();
      console.log("✅ Video added successfully");
    } catch (error) {
      console.error("❌ Error adding video:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    const fileInput = fileInputRef.current;
    const file = fileInput?.files?.[0];

    console.log("📁 handleFileUpload called", { file: file?.name, id });
    if (!file || !id) {
      console.log("⚠️ Missing file or id", { hasFile: !!file, id });
      return;
    }

    setLoading(true);
    try {
      console.log("📡 Uploading file:", file.name, "size:", file.size);
      const fd = new FormData();
      fd.set("file", file);
      const up: any = await callApi(API_ROUTES.UPLOAD.VIDEO, "POST", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("📡 Upload response:", up);
      const { storage_path, filename: fn } = up || {};

      if (storage_path) {
        console.log("📡 Adding video to task:", { storage_path, filename: fn || file.name });
        await callApi(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "POST", {
          storage_path: storage_path,
          filename: fn,
        });

        // Clear file input
        if (fileInput) fileInput.value = "";
        load();
        console.log("✅ File upload completed");
      }
    } catch (error) {
      console.error("❌ File upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status options for Combobox
  const statusOptions = [t("draft"), t("processing"), t("completed"), t("failed")];

  // Calculate optimal TTS speed based on actual subtitle timing from VTT content
  const calculateOptimalTTSSpeed = async (subtitleVideos: any[]): Promise<number> => {
    if (!subtitleVideos || subtitleVideos.length === 0) return 1.2; // Default faster speed
    
    // Find Vietnamese subtitles
    const viSubtitles = subtitleVideos.flatMap((video: any) => 
      video.subtitles?.filter((sub: any) => sub.language_code === "vi") || []
    );
    
    if (viSubtitles.length === 0) return 1.2;
    
    try {
      // Get the first Vietnamese subtitle file to analyze
      const firstSubtitle = viSubtitles[0];
      if (!firstSubtitle?.url) return 1.2;
      
      console.log(`🔍 Fetching VTT content from: ${firstSubtitle.url}`);
      
      // Fetch VTT content
      const response = await fetch(firstSubtitle.url);
      const vttContent = await response.text();
      
      // Parse VTT to extract timing and word count
      const lines = vttContent.split('\n');
      let totalWords = 0;
      let totalDurationMs = 0;
      let cueCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for timestamp lines (format: "00:00.000 --> 00:05.000")
        if (line.includes('-->')) {
          const [start, end] = line.split('-->').map(s => s.trim());
          
          // Parse timestamps to milliseconds
          const startMs = parseTimestamp(start);
          const endMs = parseTimestamp(end);
          const durationMs = endMs - startMs;
          
          // Get the text content (next non-empty line)
          let textLine = '';
          for (let j = i + 1; j < lines.length && !lines[j].includes('-->'); j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.match(/^\d+$/)) { // Skip cue numbers
              textLine += nextLine + ' ';
            }
          }
          
          if (textLine.trim()) {
            // Count words more accurately for Vietnamese
            const cleanText = textLine.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
            const words = cleanText.split(/\s+/).filter(word => word.length > 0).length;
            
            // Vietnamese speakers tend to speak faster than English, adjust word count
            const adjustedWords = Math.ceil(words * 1.1); // Slight adjustment for Vietnamese
            
            totalWords += adjustedWords;
            totalDurationMs += durationMs;
            cueCount++;
            
            // Debug log for first few cues
            if (cueCount <= 3) {
              console.log(`📝 Cue ${cueCount}: "${cleanText.substring(0, 50)}..." (${words} words, ${(durationMs/1000).toFixed(1)}s)`);
            }
          }
        }
      }
      
      if (totalDurationMs > 0 && totalWords > 0) {
        // Calculate words per minute from actual subtitle timing
        const actualWPM = (totalWords / (totalDurationMs / 1000)) * 60;
        console.log(`📊 Analyzed ${cueCount} subtitle cues: ${totalWords} words in ${(totalDurationMs/1000).toFixed(1)}s = ${actualWPM.toFixed(1)} WPM`);
        
        // Target TTS speed: aim for faster than original to match natural speech
        // TTS tends to be slower than human speech, so we need significant speed boost
        const targetWPM = Math.min(actualWPM * 1.3, 200); // 30% faster, max 200 WPM
        const normalTTSWPM = 140; // OpenAI TTS actual default (slower than claimed 150)
        const optimalSpeed = Math.max(0.8, Math.min(1.5, targetWPM / normalTTSWPM));
        
        console.log(`🎯 Calculated optimal TTS speed: ${optimalSpeed.toFixed(1)}x (target: ${targetWPM.toFixed(1)} WPM)`);
        return Math.round(optimalSpeed * 10) / 10;
      }
      
    } catch (error) {
      console.error('❌ Error analyzing subtitle timing:', error);
    }
    
    return 1.3; // Default faster speed if analysis fails
  };
  
  // Helper function to parse VTT timestamp to milliseconds
  const parseTimestamp = (timestamp: string): number => {
    // Clean timestamp and handle different formats
    const cleanTimestamp = timestamp.trim();
    
    // Format: "00:00.000", "00:00:00.000", or "00:00:00,000"
    const parts = cleanTimestamp.replace(',', '.').split(':');
    
    if (parts.length === 2) {
      // mm:ss.sss format
      const [minutes, seconds] = parts;
      const [sec, ms] = seconds.split('.');
      const msInt = ms ? parseInt(ms.padEnd(3, '0').substring(0, 3)) : 0;
      return parseInt(minutes) * 60000 + parseInt(sec) * 1000 + msInt;
    } else if (parts.length === 3) {
      // hh:mm:ss.sss format  
      const [hours, minutes, seconds] = parts;
      const [sec, ms] = seconds.split('.');
      const msInt = ms ? parseInt(ms.padEnd(3, '0').substring(0, 3)) : 0;
      return parseInt(hours) * 3600000 + parseInt(minutes) * 60000 + parseInt(sec) * 1000 + msInt;
    }
    
    return 0;
  };

  const statusValues = ["draft", "processing", "completed", "failed"];

  const handleStatusChange = (value: string) => {
    const index = statusOptions.indexOf(value);
    const statusValue = index >= 0 ? statusValues[index] : "draft";
    setMeta({ ...(meta || {}), status: statusValue });
  };

  const getCurrentStatusLabel = () => {
    const currentStatus = meta?.status || "draft";
    const index = statusValues.indexOf(currentStatus);
    return index >= 0 ? statusOptions[index] : statusOptions[0];
  };

  // Helper function to get subtitles for a specific video
  const getSubtitlesForVideo = (videoId: number) => {
    const videoData = allSubtitles.find((item) => item.video.id === videoId);
    return videoData?.subtitles || [];
  };

  // Generate subtitle for specific video
  const generateSubtitleForVideo = async (videoId: number) => {
    if (!id) return;
    setSubtitleLoading(true);
    try {
      console.log(`🎬 Generating subtitle for video ${videoId}...`);
      const res: any = await callApi(API_ROUTES.VIDEO_TASKS.VIDEO_SUBTITLES(id as string, videoId), "POST", { language_code: "vi" });
      if (res?.subtitle?.url) {
        console.log("✅ Video subtitle generated successfully");
        load(); // Refresh all data
      }
    } catch (error) {
      console.error("❌ Video subtitle generation failed:", error);
    } finally {
      setSubtitleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Task #{id}</h1>

      {/* Task Meta */}
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder={t("taskTitle") || "Title"}
            value={meta?.title || ""}
            onChange={(e) => setMeta({ ...(meta || {}), title: e.target.value })}
          />
          <Input
            placeholder={t("descriptionOptional") || "Description (optional)"}
            value={meta?.description || ""}
            onChange={(e) => setMeta({ ...(meta || {}), description: e.target.value })}
          />
          <Combobox
            options={statusOptions}
            value={getCurrentStatusLabel()}
            onChange={handleStatusChange}
            placeholder={t("status")}
            searchPlaceholder={t("search")}
            emptyText={t("noProjectsFound")}
          />
          <Button
            disabled={saving}
            onClick={async () => {
              if (!id || !meta) return;
              setSaving(true);
              try {
                await callApi(API_ROUTES.VIDEO_TASKS.DETAIL(id as string), "PUT", {
                  title: meta.title,
                  description: meta.description,
                  status: meta.status,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("processing") : t("confirm")}
          </Button>
        </div>
      </div>

      {/* Original Video with Subtitle */}
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <h3 className="text-lg font-semibold">📹 {t("originalVideoWithSubtitle")}</h3>
        {videoUrl && <VideoPlayer src={videoUrl} subtitleUrl={subtitleUrl} language="vi" />}
      </div>

      {/* Export Options & Controls */}
      <div className="rounded-lg border p-5 bg-card space-y-4">
        <h3 className="text-lg font-semibold">🎬 {t("exportOptions")}</h3>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Checkbox
              label={<span className="text-sm font-medium">{t("includeSubtitle")}</span>}
              checked={includeSubtitle}
              onChange={(e) => setIncludeSubtitle(e.target.checked)}
            />
            {includeSubtitle && (
              <div className="ml-6">
                <RadioGroup value={subtitleStyle} onValueChange={(value) => setSubtitleStyle(value as "normal" | "karaoke")} size="sm">
                  <RadioGroupItem value="normal" label={t("subtitleStyleNormal")} />
                  <RadioGroupItem value="karaoke" label={t("subtitleStyleKaraoke")} />
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Checkbox
              label={<span className="text-sm font-medium">{t("includeTTSNarration")}</span>}
              checked={includeTTS}
              onChange={(e) => setIncludeTTS(e.target.checked)}
            />
            <p className="text-xs text-muted-foreground ml-6">{t("aiVoiceoverVietnamese")}</p>

            {/* TTS Advanced Options - only show when TTS is enabled */}
            {includeTTS && (
              <div className="ml-6 space-y-2">
                <Checkbox
                  label={<span className="text-sm">{t("muteOriginalAudio")}</span>}
                  checked={muteOriginalAudio}
                  onChange={(e) => setMuteOriginalAudio(e.target.checked)}
                />
                
                {/* Voice Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{t("ttsVoice")}</label>
                  <div className="flex gap-2">
                    <select 
                      value={ttsVoice} 
                      onChange={(e) => {
                        setTtsVoice(e.target.value);
                        setVoicePreviewUrl(undefined); // Clear preview when voice changes
                      }}
                      className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                    >
                      <option value="alloy">Alloy (Nữ, Trung tính)</option>
                      <option value="echo">Echo (Nam, Rõ ràng)</option>
                      <option value="fable">Fable (Nam, Ấm áp)</option>
                      <option value="onyx">Onyx (Nam, Trầm)</option>
                      <option value="nova">Nova (Nữ, Tươi sáng)</option>
                      <option value="shimmer">Shimmer (Nữ, Nhẹ nhàng)</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Use on-demand voice sample generation via API
                        const sampleUrl = `/api/samples/voices/${ttsVoice}`;
                        setVoicePreviewUrl(sampleUrl);
                        console.log(`🎵 Loading voice sample: ${ttsVoice}`);
                      }}
                      className="text-xs px-2"
                    >
                      {t("previewVoice")}
                    </Button>
                  </div>
                  
                  {/* Preview Audio Player */}
                  {voicePreviewUrl && (
                    <div className="mt-2">
                      <audio controls className="w-full" style={{ height: '32px' }}>
                        <source src={voicePreviewUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>
                
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("exportPreview")}</div>
            <div className="text-xs text-muted-foreground">
              {!includeSubtitle && !includeTTS && t("originalVideoOnly")}
              {includeSubtitle && !includeTTS && t("videoWithSubtitle", { style: subtitleStyle })}
              {!includeSubtitle && includeTTS && t("videoWithTTS")}
              {includeSubtitle && includeTTS && t("videoWithTTSAndSubtitle", { style: subtitleStyle })}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button
          variant="primary"
          size="lg"
          disabled={exportLoading}
          onClick={async () => {
            if (!id) return;
            setExportLoading(true);
            try {
              console.log(`🎬 Starting video export with options:`, { includeSubtitle, includeTTS, subtitleStyle, muteOriginalAudio, ttsVoice, autoSpeed });
              const res: any = await callApi(API_ROUTES.VIDEO_TASKS.EXPORT_VI(id as string), "POST", {
                includeSubtitle,
                includeTTS,
                subtitleStyle,
                muteOriginalAudio,
                ttsVoice,
                ttsSpeed: autoSpeed,
              });
              const sp = res?.storage_path;
              if (sp) {
                const exportUrl = sp; // Direct static serve from public
                setExportedVideoUrl(exportUrl);
                console.log("✅ Video export completed successfully");
              }
            } catch (error) {
              console.error("❌ Video export failed:", error);
            } finally {
              setExportLoading(false);
            }
          }}
        >
          {exportLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t("exportingVideo")} (120s)
            </>
          ) : (
            t("exportVideoWithOptions")
          )}
        </Button>
      </div>

      {/* Exported Video Display */}
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <h3 className="text-lg font-semibold">🔥 {t("exportedVideo")}</h3>
        {exportedVideoUrl ? (
          <div className="space-y-3">
            <VideoPlayer src={exportedVideoUrl} language="vi" />
            <div className="flex gap-3">
              <a href={exportedVideoUrl} target="_blank" rel="noopener" className="inline-flex">
                <Button variant="success">📥 {t("downloadFinalVideo")}</Button>
              </a>
              <Button variant="outline" onClick={() => setExportedVideoUrl(undefined)}>
                🗑️ {t("clear")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">🎬</div>
            <p>{t("noExportedVideo")}</p>
          </div>
        )}
      </div>

      {/* Video Upload Section */}
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <h3 className="text-lg font-semibold">📤 {t("uploadNewVideo")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder={t("videoUrl") || "Video URL"} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <Input placeholder={t("fileNameOptional") || "Filename (optional)"} value={filename} onChange={(e) => setFilename(e.target.value)} />
          <Button onClick={onAdd} disabled={loading}>
            {loading ? t("processing") : t("addVideo")}
          </Button>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                console.log("📁 File selected:", file?.name);
              }}
            />
            <Button onClick={handleFileUpload} disabled={loading}>
              {loading ? t("processing") : t("addVideo")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v) => {
          const videoSubtitles = getSubtitlesForVideo(v.id);
          const hasSubtitle = videoSubtitles.length > 0;
          const latestSubtitle = videoSubtitles[0]; // Most recent

          return (
            <div key={v.id} className="rounded-lg border p-5 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-sm break-words">{v.source_url || v.filename}</div>
                {v.is_primary && <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">{t("primary")}</span>}
              </div>

              {v.format && <div className="text-xs text-muted-foreground mt-1">{v.format}</div>}
              {v.duration_seconds && <div className="text-xs text-muted-foreground">{v.duration_seconds}s</div>}

              {/* Subtitle Status */}
              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                {hasSubtitle ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600">
                      ✅ <span>Subtitle available ({latestSubtitle.language_code})</span>
                    </div>
                    <div className="flex gap-1">
                      <a href={latestSubtitle.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        📄 Download
                      </a>
                      {v.is_primary && (
                        <button onClick={() => setSubtitleUrl(latestSubtitle.url)} className="text-blue-600 hover:underline ml-2">
                          📺 Preview
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">📝 No subtitle yet</div>
                )}
              </div>

              {v.created_at && <div className="text-[11px] text-muted-foreground mt-2">{new Date(v.created_at).toLocaleString()}</div>}

              <div className="mt-3 flex gap-2">
                {/* Generate Subtitle Button */}
                <button
                  className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/80 disabled:opacity-50"
                  disabled={subtitleLoading}
                  onClick={() => generateSubtitleForVideo(v.id)}
                >
                  {subtitleLoading ? "🔄" : "🎬"} {hasSubtitle ? "Regenerate" : "Generate"} Sub
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!v.is_primary}
                  onClick={async () => {
                    await callApi(API_ROUTES.VIDEOS.PRIMARY(v.id), "POST");
                    load();
                  }}
                >
                  {t("setPrimary")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(t("deleteConfirm") || "Delete this video?")) return;
                    await callApi(API_ROUTES.VIDEOS.ITEM(v.id), "DELETE");
                    load();
                  }}
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          );
        })}
        {!videos.length && <div className="text-sm text-muted-foreground">{t("noVideos")}</div>}
      </div>
    </div>
  );
}
