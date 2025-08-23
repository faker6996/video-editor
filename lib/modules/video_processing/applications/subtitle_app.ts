import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { baseRepo } from "@/lib/modules/common/base_repo";
import { SubtitleTrack, VideoEditSettings } from "@/lib/models";
import { TranscriptSegment, toVtt, toSrt } from "@/lib/utils/subtitle";
import { safeQuery } from "@/lib/modules/common/safe_query";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

async function callOpenAITranscribe(urlOrPath: string): Promise<{ segments: TranscriptSegment[]; language?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

  // If no API key, return fallback demo segments to keep dev flow working
  if (!apiKey) {
    console.log("⚠️ No OpenAI API key found, using demo subtitles");
    return {
      segments: [
        { start: 0, end: 2.5, text: "Xin chào, đây là phụ đề mẫu." },
        { start: 2.6, end: 6.0, text: "Tính năng phụ đề tiếng Việt đang hoạt động." },
        { start: 6.1, end: 10.0, text: "Bạn có thể tải xuống file phụ đề." },
      ],
      language: "vi",
    };
  }

  // Only support local file paths (we store to disk after upload)
  const absPath =
    urlOrPath.startsWith("/") || urlOrPath.startsWith("./") || urlOrPath.includes("uploads")
      ? urlOrPath
      : path.join(process.env.UPLOAD_DIR || "./uploads", urlOrPath);
  if (!fs.existsSync(absPath)) {
    throw new Error("Audio/video file not found for transcription");
  }

  console.log(`🎤 Starting OpenAI transcription for file: ${path.basename(absPath)}`);
  const transcribeStart = Date.now();

  try {
    // Read file as buffer and create File object for FormData
    const fileBuffer = fs.readFileSync(absPath);
    const fileName = path.basename(absPath);
    const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`📁 File size: ${fileSizeMB}MB`);

    const file = new File([fileBuffer], fileName, {
      type: "video/mp4", // Default to mp4, OpenAI will auto-detect
    });

    // Build multipart form for OpenAI audio transcription
    const form = new FormData();
    form.append("file", file);
    form.append("model", model);
    form.append("response_format", "verbose_json");

    // Add timeout for fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${apiBase}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`OpenAI transcribe failed: ${res.status} ${errTxt}`);
    }
    const data: any = await res.json();
    const transcribeDuration = (Date.now() - transcribeStart) / 1000;
    console.log(`✅ OpenAI transcription completed in ${transcribeDuration.toFixed(2)}s`);

    const segments: TranscriptSegment[] = (data.segments || []).map((s: any) => ({ start: s.start, end: s.end, text: s.text }));
    const language: string | undefined = data.language;
    console.log(`🌍 Detected language: ${language}, ${segments.length} segments`);

    // Optional: translate to Vietnamese using an LLM if configured
    const translateModel = process.env.OPENAI_TRANSLATE_MODEL; // e.g., 'gpt-4o-mini'
    if (translateModel && language && language !== "vi" && segments.length) {
      console.log(`🔄 Translating from ${language} to Vietnamese using ${translateModel}...`);
      const translateStart = Date.now();

      // Pack texts into a single JSON for efficient translation preserving segmentation
      const texts = segments.map((s) => s.text);
      const prompt = `Translate the following array of transcript segments to Vietnamese. Keep array length and order. Return JSON array of strings only.\n\n${JSON.stringify(
        texts
      )}`;

      const resp = await fetch(`${apiBase}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: translateModel,
          messages: [
            { role: "system", content: "You are a precise subtitle translator." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (resp.ok) {
        const out: any = await resp.json();
        const content = out.choices?.[0]?.message?.content;
        console.log(`🔍 Translation response:`, content?.substring(0, 200) + "...");

        try {
          // Clean up the response - remove markdown code blocks if present
          let cleanContent = content?.trim();
          if (cleanContent?.startsWith("```json")) {
            cleanContent = cleanContent.replace(/```json\s*/, "").replace(/```\s*$/, "");
          } else if (cleanContent?.startsWith("```")) {
            cleanContent = cleanContent.replace(/```\s*/, "").replace(/```\s*$/, "");
          }

          const arr = JSON.parse(cleanContent);
          if (Array.isArray(arr) && arr.length === segments.length) {
            for (let i = 0; i < segments.length; i++) {
              segments[i].text = arr[i];
            }
            const translateDuration = (Date.now() - translateStart) / 1000;
            console.log(`✅ Translation completed in ${translateDuration.toFixed(2)}s`);
          } else {
            console.warn(`⚠️ Translation array length mismatch: expected ${segments.length}, got ${arr?.length || 0}`);
          }
        } catch (e) {
          console.warn("⚠️ Translation parsing failed:", e instanceof Error ? e.message : "Unknown error");
          console.warn("Raw content:", content);
        }
      } else {
        const errorText = await resp.text();
        console.warn("⚠️ Translation API failed:", resp.status, errorText);
      }
    }

    return { segments, language };
  } catch (error) {
    const duration = (Date.now() - transcribeStart) / 1000;
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenAI transcription timeout after 30 seconds`);
    }
    console.error(`❌ OpenAI transcription failed after ${duration.toFixed(2)}s:`, error);
    throw error;
  }
}

export async function callOpenAITextToSpeech(text: string, outputPath: string, options?: { voice?: string; speed?: number }): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
  const model = process.env.OPENAI_TTS_MODEL || "tts-1";
  const voice = options?.voice || process.env.OPENAI_TTS_VOICE || "alloy"; // alloy, echo, fable, onyx, nova, shimmer
  const speed = options?.speed || 1.0; // 0.25 to 4.0

  if (!apiKey) {
    throw new Error("OpenAI API key required for TTS generation");
  }

  console.log(`🎙️ Starting TTS generation: ${text.length} characters, voice: ${voice}, speed: ${speed}x`);
  const ttsStart = Date.now();

  try {
    const response = await fetch(`${apiBase}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: "mp3",
        speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI TTS failed: ${response.status} ${errorText}`);
    }

    // Save audio to file
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);

    const duration = (Date.now() - ttsStart) / 1000;
    console.log(`✅ TTS generation completed in ${duration.toFixed(2)}s, saved to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ TTS generation failed:`, error);
    throw error;
  }
}

// Generate karaoke-style VTT with word-level timing
function toKaraokeVtt(segments: TranscriptSegment[]): string {
  const header = `WEBVTT

STYLE
::cue {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans), Arial, sans-serif;
  font-size: 24px;
  text-align: center;
  line-height: 1.2;
  padding: 8px 12px;
  border-radius: 6px;
  opacity: 0.95;
  border: 1px solid hsl(var(--border));
}

::cue(.highlight) {
  color: hsl(var(--primary));
  font-weight: bold;
  text-shadow: 0 1px 2px hsl(var(--background));
  background-color: hsl(var(--accent));
}

`;

  const body = segments
    .map((seg, idx) => {
      const start = toTimecode(seg.start).replace(",", ".");
      const end = toTimecode(seg.end).replace(",", ".");

      // Split text into words for karaoke effect
      const words = seg.text.trim().split(/\s+/);
      const duration = seg.end - seg.start;
      const timePerWord = duration / words.length;

      let karaokeText = "";
      words.forEach((word, wordIdx) => {
        const wordStart = seg.start + wordIdx * timePerWord;
        const wordEnd = seg.start + (wordIdx + 1) * timePerWord;
        const wordStartTime = toTimecode(wordStart).replace(",", ".");
        const wordEndTime = toTimecode(wordEnd).replace(",", ".");

        if (wordIdx === 0) {
          karaokeText += `${start} --> ${wordEndTime}\n<c.highlight>${word}</c> ${words.slice(1).join(" ")}\n\n`;
        }

        if (wordIdx > 0 && wordIdx < words.length - 1) {
          const beforeWords = words.slice(0, wordIdx).join(" ");
          const afterWords = words.slice(wordIdx + 1).join(" ");
          karaokeText += `${wordStartTime} --> ${wordEndTime}\n${beforeWords} <c.highlight>${word}</c> ${afterWords}\n\n`;
        }
      });

      return karaokeText || `${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");

  return header + body;
}

function toTimecode(sec: number): string {
  const ms = Math.round((sec % 1) * 1000);
  const total = Math.floor(sec);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

// Helper functions to parse existing subtitle files
function parseVttToSegments(vttContent: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const lines = vttContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
      if (timeMatch) {
        const start = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3]) + parseFloat(timeMatch[4]) / 1000;
        const end = parseFloat(timeMatch[5]) * 3600 + parseFloat(timeMatch[6]) * 60 + parseFloat(timeMatch[7]) + parseFloat(timeMatch[8]) / 1000;

        // Get text from next non-empty line
        let text = "";
        for (let j = i + 1; j < lines.length && lines[j].trim(); j++) {
          text += lines[j].trim() + " ";
        }

        if (text.trim()) {
          segments.push({ start, end, text: text.trim().replace(/<[^>]*>/g, "") });
        }
      }
    }
  }
  return segments;
}

function parseSrtToSegments(srtContent: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const blocks = srtContent.split("\n\n").filter((block) => block.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);

      if (timeMatch) {
        const start = parseFloat(timeMatch[1]) * 3600 + parseFloat(timeMatch[2]) * 60 + parseFloat(timeMatch[3]) + parseFloat(timeMatch[4]) / 1000;
        const end = parseFloat(timeMatch[5]) * 3600 + parseFloat(timeMatch[6]) * 60 + parseFloat(timeMatch[7]) + parseFloat(timeMatch[8]) / 1000;
        const text = lines.slice(2).join(" ").trim();

        if (text) {
          segments.push({ start, end, text });
        }
      }
    }
  }
  return segments;
}

async function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export const subtitleApp = {
  async generateVietnameseSubtitle(taskId: number, format: "vtt" | "srt" | "both" = "vtt") {
    const videos = await videoTaskRepo.listVideosForTask(taskId);
    if (!videos.length) throw new Error("No videos in task");
    const primary = videos.find((v) => v.is_primary) || videos[0];

    if (!primary?.id) throw new Error("Primary video not found");

    // ✅ Check existing subtitle first to avoid re-transcription
    const existingSubtitles = await baseRepo.findManyByFields<SubtitleTrack>(SubtitleTrack, { video_id: primary.id, language_code: "vi" });

    if (existingSubtitles.length > 0) {
      const existing = existingSubtitles[0];
      console.log(`📝 Found existing subtitle: ${existing.storage_path}`);

      // Check if we already have the requested format
      const currentFormat = existing.format;
      const currentPath = existing.storage_path;

      if (format === currentFormat || format === "both") {
        // Verify file exists before returning existing
        let fileExists = false;
        if (currentPath) {
          let checkPath;
          if (currentPath.startsWith("/uploads/")) {
            const normalizedPath = currentPath.substring(9);
            checkPath = path.join(UPLOAD_DIR, normalizedPath);
          } else {
            checkPath = path.join(UPLOAD_DIR, currentPath);
          }
          fileExists = fs.existsSync(checkPath);
          console.log(`📂 Checking existing file: ${checkPath} - exists: ${fileExists ? 'YES' : 'NO'}`);
        }
        
        if (fileExists) {
          // Return existing if format matches AND file exists
          return {
            track: existing,
            vtt_path: currentFormat === "vtt" ? currentPath : null,
            srt_path: currentFormat === "srt" ? currentPath : null,
          };
        } else {
          console.log(`⚠️ Existing subtitle record found but file missing, will regenerate`);
          // Continue to regeneration logic below
        }
      }

      // If need different format, convert existing instead of re-transcribe
      let conversionPath = "";
      if (currentPath) {
        if (currentPath.startsWith("/uploads/")) {
          const normalizedPath = currentPath.substring(9);
          conversionPath = path.join(UPLOAD_DIR, normalizedPath);
        } else {
          conversionPath = path.join(UPLOAD_DIR, currentPath);
        }
      }
      if (currentPath && fs.existsSync(conversionPath)) {
        console.log(`🔄 Converting existing ${currentFormat} to ${format}`);

        const content = fs.readFileSync(conversionPath, "utf8");
        let segments: TranscriptSegment[] = [];

        // Parse existing subtitle to get segments
        if (currentFormat === "vtt") {
          segments = parseVttToSegments(content);
        } else if (currentFormat === "srt") {
          segments = parseSrtToSegments(content);
        }

        // Generate requested format
        return await this.saveSubtitleFormats(taskId, primary.id, segments, format);
      }
    }

    // ❌ Only transcribe if no existing subtitle found
    console.log(`🎤 No existing subtitle found, transcribing...`);
    
    // Fix path for public/uploads - normalize storage_path
    let source = "";
    if (primary.storage_path) {
      const normalizedPath = primary.storage_path.startsWith("/uploads/") 
        ? primary.storage_path.substring(9) // Remove "/uploads/" prefix
        : primary.storage_path;
      source = path.join(UPLOAD_DIR, normalizedPath);
    } else {
      source = primary.source_url || "";
    }
    
    console.log(`🎤 Transcribing from: ${source}`);
    const { segments, language } = await callOpenAITranscribe(source);

    return await this.saveSubtitleFormats(taskId, primary.id, segments, format);
  },

  // Helper method to save subtitle formats
  async saveSubtitleFormats(taskId: number, videoId: number, segments: TranscriptSegment[], format: "vtt" | "srt" | "both") {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const relDir = `subtitles/${year}/${month}/${day}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    await ensureDir(absDir);

    let vttPath = "",
      srtPath = "";

    // Only generate requested formats
    if (format === "vtt" || format === "both") {
      const vtt = toVtt(segments);
      const filenameVtt = `task_${taskId}_vi.vtt`;
      const relPathVtt = `${relDir}/${filenameVtt}`;
      const absPathVtt = path.join(UPLOAD_DIR, relPathVtt);
      
      console.log(`📁 Saving VTT file:`);
      console.log(`  - relDir: ${relDir}`);
      console.log(`  - filename: ${filenameVtt}`);
      console.log(`  - relPath: ${relPathVtt}`);
      console.log(`  - absPath: ${absPathVtt}`);
      console.log(`  - UPLOAD_DIR: ${UPLOAD_DIR}`);
      
      // Ensure directory exists
      await ensureDir(path.dirname(absPathVtt));
      fs.writeFileSync(absPathVtt, vtt, "utf8");
      
      // Verify file was actually written
      if (fs.existsSync(absPathVtt)) {
        console.log(`✅ VTT file successfully written to: ${absPathVtt}`);
        vttPath = `/uploads/${relPathVtt}`; // Add /uploads/ prefix for consistency
      } else {
        console.error(`❌ Failed to write VTT file to: ${absPathVtt}`);
        throw new Error(`Failed to save VTT file to: ${absPathVtt}`);
      }
    }

    if (format === "srt" || format === "both") {
      const srt = toSrt(segments);
      const filenameSrt = `task_${taskId}_vi.srt`;
      const relPathSrt = `${relDir}/${filenameSrt}`;
      const absPathSrt = path.join(UPLOAD_DIR, relPathSrt);
      fs.writeFileSync(absPathSrt, srt, "utf8");
      srtPath = `/uploads/${relPathSrt}`; // Add /uploads/ prefix for consistency
    }

    // Upsert subtitle track
    const track = new SubtitleTrack({
      video_id: videoId,
      language_code: "vi",
      storage_path: vttPath || srtPath,
      format: format === "srt" ? "srt" : "vtt",
      is_auto_generated: true,
    });
    const created = await baseRepo.insert<SubtitleTrack>(track);

    // Update video_edit_settings flags
    const settings = new VideoEditSettings({
      video_id: videoId,
      enable_auto_subtitles: true,
      enable_auto_translate: true,
      current_subtitle_lang: "vi",
      target_languages: ["vi"] as any,
    });
    await baseRepo.insert<VideoEditSettings>(settings);

    return {
      track: created,
      vtt_path: vttPath || null,
      srt_path: srtPath || null,
    };
  },

  // New method: Generate subtitle for specific video
  async generateSubtitleForVideo(videoId: number, languageCode: string = "vi") {
    const video = await videoTaskRepo.getVideoById(videoId);
    if (!video) throw new Error("Video not found");

    // Fix path for public/uploads - normalize storage_path
    let source = "";
    if (video.storage_path) {
      const normalizedPath = video.storage_path.startsWith("/uploads/") 
        ? video.storage_path.substring(9) // Remove "/uploads/" prefix
        : video.storage_path;
      source = path.join(UPLOAD_DIR, normalizedPath);
    } else {
      source = video.source_url || "";
    }
    const { segments, language } = await callOpenAITranscribe(source);
    const vtt = toVtt(segments);
    const srt = toSrt(segments);

    // Save file under /uploads/subtitles/YYYY/MM/DD/video_<videoId>_<lang>.vtt
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const relDir = `subtitles/${year}/${month}/${day}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    await ensureDir(absDir);

    const filenameVtt = `video_${videoId}_${languageCode}.vtt`;
    const relPathVtt = `${relDir}/${filenameVtt}`;
    const absPathVtt = path.join(UPLOAD_DIR, relPathVtt);
    fs.writeFileSync(absPathVtt, vtt, "utf8");

    const filenameSrt = `video_${videoId}_${languageCode}.srt`;
    const relPathSrt = `${relDir}/${filenameSrt}`;
    const absPathSrt = path.join(UPLOAD_DIR, relPathSrt);
    fs.writeFileSync(absPathSrt, srt, "utf8");

    // Upsert subtitle track
    const track = new SubtitleTrack({
      video_id: videoId,
      language_code: languageCode,
      storage_path: `/uploads/${relPathVtt}`, // Add /uploads/ prefix for consistency
      format: "vtt",
      is_auto_generated: true,
    });
    const created = await baseRepo.insert<SubtitleTrack>(track);

    return { track: created, vtt_path: `/uploads/${relPathVtt}`, srt_path: `/uploads/${relPathSrt}` };
  },

  // Get all subtitles for a task (across all videos)
  async getSubtitlesForTask(taskId: number) {
    const videos = await videoTaskRepo.listVideosForTask(taskId);
    const allSubtitles = [];

    for (const video of videos) {
      const subtitles = await baseRepo.findManyByFields<SubtitleTrack>(
        SubtitleTrack,
        { video_id: video.id },
        {
          orderBy: ["language_code", "id"],
          allowedOrderFields: ["language_code", "id", "created_at", "format"],
        }
      );

      allSubtitles.push({
        video,
        subtitles: subtitles.map((sub) => ({
          ...sub,
          url: sub.storage_path ? `/api/uploads${sub.storage_path}` : sub.url,
        })),
      });
    }

    return allSubtitles;
  },

  async generateVietnameseTTS(taskId: number, options?: { voice?: string; speed?: number }): Promise<{ audio_path: string }> {
    const videos = await videoTaskRepo.listVideosForTask(taskId);
    if (!videos.length) throw new Error("No videos in task");
    const primary = videos.find((v) => v.is_primary) || videos[0];

    // Check if we already have Vietnamese subtitles
    let vttPath = "";
    let needRegenerate = false;
    const existingSubtitles = await baseRepo.findManyByFields<SubtitleTrack>(SubtitleTrack, { video_id: primary.id, language_code: "vi" });

    if (existingSubtitles.length > 0 && existingSubtitles[0].storage_path) {
      vttPath = existingSubtitles[0].storage_path;
      console.log(`📝 Found existing subtitle record: ${vttPath}`);

      // ✅ Verify if file actually exists
      let vttAbs;
      if (vttPath.startsWith("/uploads/")) {
        const normalizedPath = vttPath.substring(9);
        vttAbs = path.join(UPLOAD_DIR, normalizedPath);
      } else {
        vttAbs = path.join(UPLOAD_DIR, vttPath);
      }

      // Try fallback path if main path doesn't exist (removed double uploads fallback)
      if (!fs.existsSync(vttAbs)) {
        console.log(`⚠️ Subtitle file not found, will regenerate`);
        needRegenerate = true;
      } else {
        console.log(`✅ Found subtitle file at main path`);
      }

      // If file exists, use it
      if (!needRegenerate) {
        const vttContent = fs.readFileSync(vttAbs, "utf8");
        return await this.processTTSFromContent(taskId, vttContent, options);
      }
    } else {
      needRegenerate = true;
    }

    // ✅ Generate subtitle if needed (either no record or file missing)
    console.log(`🎤 Generating new subtitle for TTS...`);
    const result = await this.generateVietnameseSubtitle(taskId, "vtt");
    if (!result.vtt_path) {
      throw new Error("Failed to generate VTT subtitle for TTS");
    }
    vttPath = result.vtt_path;
    console.log(`📝 Generated new subtitle for TTS: ${vttPath}`);

    // Read the newly generated file
    let vttAbs;
    if (vttPath.startsWith("/uploads/")) {
      // Remove /uploads/ prefix since UPLOAD_DIR already points to uploads folder
      const normalizedPath = vttPath.substring(9);
      vttAbs = path.join(UPLOAD_DIR, normalizedPath);
    } else {
      vttAbs = path.join(UPLOAD_DIR, vttPath);
    }
    
    console.log(`📂 Reading subtitle from: ${vttAbs}`);
    console.log(`🔍 UPLOAD_DIR: ${UPLOAD_DIR}`);
    console.log(`🔍 vttPath: ${vttPath}`);
    console.log(`🔍 Checking file exists: ${fs.existsSync(vttAbs) ? 'YES' : 'NO'}`);
    
    if (!fs.existsSync(vttAbs)) {
      // Try alternative paths
      const altPath1 = path.resolve(UPLOAD_DIR, vttPath.startsWith("/uploads/") ? vttPath.substring(9) : vttPath);
      const altPath2 = path.join("./uploads", vttPath.startsWith("/uploads/") ? vttPath.substring(9) : vttPath);
      console.log(`🔍 Alt path 1: ${altPath1} - exists: ${fs.existsSync(altPath1) ? 'YES' : 'NO'}`);
      console.log(`🔍 Alt path 2: ${altPath2} - exists: ${fs.existsSync(altPath2) ? 'YES' : 'NO'}`);
      
      if (fs.existsSync(altPath1)) {
        vttAbs = altPath1;
      } else if (fs.existsSync(altPath2)) {
        vttAbs = altPath2;
      } else {
        // File not found anywhere - regenerate subtitle instead of throwing error
        console.log(`⚠️ Subtitle file not found at any path, regenerating...`);
        const result = await this.generateVietnameseSubtitle(taskId, "vtt");
        if (!result.vtt_path) {
          throw new Error("Failed to generate VTT subtitle for TTS after file not found");
        }
        
        // Use the newly generated file path
        const newVttPath = result.vtt_path;
        const newNormalizedPath = newVttPath.startsWith("/uploads/") ? newVttPath.substring(9) : newVttPath;
        vttAbs = path.join(UPLOAD_DIR, newNormalizedPath);
        
        console.log(`✅ Regenerated subtitle, using: ${vttAbs}`);
        if (!fs.existsSync(vttAbs)) {
          throw new Error(`Even after regeneration, subtitle file not found: ${vttAbs}`);
        }
      }
    }
    const vttContent = fs.readFileSync(vttAbs, "utf8");
    return await this.processTTSFromContent(taskId, vttContent, options);
  },

  // Helper method to process TTS from VTT content
  async processTTSFromContent(taskId: number, vttContent: string, options?: { voice?: string; speed?: number }): Promise<{ audio_path: string }> {
    // Extract text from VTT (simple parsing)
    const textLines = vttContent
      .split("\n")
      .filter((line) => line.trim() && !line.includes("-->") && !line.startsWith("WEBVTT") && !line.startsWith("STYLE"))
      .filter((line) => !line.match(/^\d+$/)) // Remove cue numbers
      .map((line) => line.replace(/<[^>]*>/g, "")) // Remove HTML tags
      .filter((line) => line.trim().length > 0);

    const fullText = textLines.join(". ");
    console.log(`📝 TTS text: ${fullText.substring(0, 100)}...`);

    // Save TTS audio
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const relDir = `tts/${year}/${month}/${day}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    await ensureDir(absDir);

    const filename = `task_${taskId}_vi_tts.mp3`;
    const relPath = `${relDir}/${filename}`;
    const absPath = path.join(UPLOAD_DIR, relPath);

    await callOpenAITextToSpeech(fullText, absPath, options || {});

    return { audio_path: `/uploads/${relPath}` };
  },

  async generateKaraokeSubtitle(taskId: number): Promise<{ karaoke_vtt_path: string }> {
    const videos = await videoTaskRepo.listVideosForTask(taskId);
    if (!videos.length) throw new Error("No videos in task");
    const primary = videos.find((v) => v.is_primary) || videos[0];

    // First, try to get segments from existing Vietnamese subtitle
    let segments: TranscriptSegment[] = [];
    let shouldTranscribe = true;

    // Check if we have existing Vietnamese subtitle
    const existingSubtitles = await baseRepo.findManyByFields<SubtitleTrack>(SubtitleTrack, { 
      video_id: primary.id, 
      language_code: "vi" 
    });

    if (existingSubtitles.length > 0 && existingSubtitles[0].storage_path) {
      const existingPath = existingSubtitles[0].storage_path;
      console.log(`📝 Found existing Vietnamese subtitle: ${existingPath}`);
      
      // Try to read existing VTT file
      const normalizedExistingPath = existingPath.startsWith("/uploads/") 
        ? existingPath.substring(9) 
        : existingPath;
      const vttAbs = path.join(UPLOAD_DIR, normalizedExistingPath);
      
      if (fs.existsSync(vttAbs)) {
        console.log(`♻️ Reusing existing subtitle segments for karaoke`);
        const vttContent = fs.readFileSync(vttAbs, "utf8");
        segments = parseVttToSegments(vttContent);
        shouldTranscribe = false;
      }
    }

    // Fallback: transcribe if no existing subtitle found
    if (shouldTranscribe || segments.length === 0) {
      console.log(`🎤 No existing subtitle found, transcribing video...`);
      const source = primary.storage_path;
      if (!source) throw new Error("No video source found");

      const normalizedPath = source.startsWith("/uploads/") 
        ? source.substring(9) 
        : source;
      const fullPath = path.join(UPLOAD_DIR, normalizedPath);
      
      const { segments: newSegments } = await callOpenAITranscribe(fullPath);
      segments = newSegments;
    }

    const karaokeVtt = toKaraokeVtt(segments);

    // Save karaoke VTT
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const relDir = `subtitles/${year}/${month}/${day}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    await ensureDir(absDir);

    const filename = `task_${taskId}_karaoke.vtt`;
    const relPath = `${relDir}/${filename}`;
    const absPath = path.join(UPLOAD_DIR, relPath);
    fs.writeFileSync(absPath, karaokeVtt, "utf8");

    console.log(`✅ Karaoke subtitle saved: /uploads/${relPath}`);
    return { karaoke_vtt_path: `/uploads/${relPath}` };
  },
};
