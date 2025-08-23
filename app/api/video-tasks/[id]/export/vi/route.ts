import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

// Increase timeout for video export with subtitles
export const maxDuration = 120; // 2 minutes for video processing

async function getHandler(req: NextRequest, { params }: any) {
  // We return 405 for GET to avoid heavy work; use POST to trigger export
  return createResponse(null, "Method Not Allowed", 405);
}

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const resolvedParams = await params;
  const id = Number(resolvedParams?.id);

  // Parse export options
  const body = await req.json().catch(() => ({}));
  const {
    includeSubtitle = true,
    includeTTS = false,
    subtitleStyle = "normal", // "normal" | "karaoke"
    muteOriginalAudio = false, // true = chỉ nghe TTS, false = mix TTS với tiếng gốc
    ttsVoice = "alloy", // OpenAI TTS voice: alloy, echo, fable, onyx, nova, shimmer
    ttsSpeed = 1.0, // TTS speed: 0.5-1.5
  } = body;

  console.log(`🎬 Starting video export for task ${id} - TTS: ${includeTTS} (voice: ${ttsVoice}, speed: ${ttsSpeed}x), Subtitle: ${includeSubtitle} (${subtitleStyle}), Mute original: ${muteOriginalAudio}`);
  const startTime = Date.now();

  const videos = await videoTaskRepo.listVideosForTask(id);
  if (!videos.length) return createResponse(null, "No videos", 400);
  const primary = videos.find((v) => v.is_primary) || videos[0];
  // Normalize video path - remove /uploads/ prefix since UPLOAD_DIR already points to uploads
  const normalizedVideoPath = primary.storage_path?.startsWith("/uploads/") 
    ? primary.storage_path.substring(9) 
    : primary.storage_path || "";
  const videoAbs = normalizedVideoPath ? path.join(UPLOAD_DIR, normalizedVideoPath) : "";
  if (!videoAbs || !fs.existsSync(videoAbs)) return createResponse(null, "Primary video not found on disk", 400);

  // Output path
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const outRelDir = `exports/${year}/${month}/${day}`;
  const outAbsDir = path.join(UPLOAD_DIR, outRelDir);
  if (!fs.existsSync(outAbsDir)) fs.mkdirSync(outAbsDir, { recursive: true });

  // Generate descriptive filename
  let suffix = "_original";
  if (includeTTS && includeSubtitle) {
    const mutePrefix = muteOriginalAudio ? "_muted" : "";
    suffix = subtitleStyle === "karaoke" ? `_tts_karaoke${mutePrefix}` : `_tts_sub${mutePrefix}`;
  } else if (includeTTS) {
    const mutePrefix = muteOriginalAudio ? "_muted" : "";
    suffix = `_tts${mutePrefix}`;
  } else if (includeSubtitle) {
    suffix = subtitleStyle === "karaoke" ? "_karaoke" : "_sub";
  }

  const outRel = `/uploads/${outRelDir}/task_${id}${suffix}.mp4`;
  const outAbs = path.join(UPLOAD_DIR, `${outRelDir}/task_${id}${suffix}.mp4`);

  try {
    let srtAbs = "";
    let ttsAbs = "";

    // Generate TTS if needed
    if (includeTTS) {
      console.log(`🎙️ Generating TTS for task ${id} with voice: ${ttsVoice}, speed: ${ttsSpeed}x...`);
      const { audio_path } = await subtitleApp.generateVietnameseTTS(id, { voice: ttsVoice, speed: ttsSpeed });
      // Normalize path - remove /uploads/ prefix since UPLOAD_DIR already points to uploads
      const normalizedTtsPath = audio_path.startsWith("/uploads/") ? audio_path.substring(9) : audio_path;
      ttsAbs = path.join(UPLOAD_DIR, normalizedTtsPath);
      console.log(`✅ TTS ready: ${audio_path} → ${ttsAbs}`);
    }

    // Generate subtitle if needed
    if (includeSubtitle) {
      if (subtitleStyle === "karaoke") {
        console.log(`🎤 Generating karaoke subtitle for task ${id}...`);
        const { karaoke_vtt_path } = await subtitleApp.generateKaraokeSubtitle(id);
        // Convert karaoke VTT to ASS format to preserve karaoke highlighting effects
        const normalizedKaraokePath = karaoke_vtt_path.startsWith("/uploads/") ? karaoke_vtt_path.substring(9) : karaoke_vtt_path;
        const vttContent = fs.readFileSync(path.join(UPLOAD_DIR, normalizedKaraokePath), "utf8");
        
        // Parse VTT and convert to ASS with karaoke effects
        const lines = vttContent.split('\n');
        let assEvents = '';
        let i = 0;
        
        // Skip header and styles
        while (i < lines.length && !lines[i].includes('-->')) {
          i++;
        }
        
        while (i < lines.length) {
          const line = lines[i].trim();
          
          // Find timing line
          if (line.includes('-->')) {
            const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
            if (timeMatch) {
              const startTime = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}.${timeMatch[4].substring(0,2)}`;
              const endTime = `${timeMatch[5]}:${timeMatch[6]}:${timeMatch[7]}.${timeMatch[8].substring(0,2)}`;
              
              // Get text content with highlight tags
              i++;
              let textLine = '';
              while (i < lines.length && lines[i].trim()) {
                const text = lines[i].trim();
                if (text && !text.includes('-->')) {
                  textLine = text;
                  break; // Take first text line with highlight tags
                }
                i++;
              }
              
              if (textLine) {
                // Convert <c.highlight> tags to ASS karaoke format
                let assText = textLine
                  .replace(/<c\.highlight>/g, '{\\c&H00FFFF&}') // Yellow highlight color
                  .replace(/<\/c>/g, '{\\c&HFFFFFF&}'); // Back to white
                
                // Remove any remaining HTML tags
                assText = assText.replace(/<[^>]*>/g, '');
                
                // Add ASS event line
                assEvents += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${assText}\n`;
              }
            }
          }
          i++;
        }
        
        // Create complete ASS file content
        const assContent = `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,24,&Hffffff,&Hffffff,&H80000000,&H80000000,1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${assEvents}`;

        const assPath = normalizedKaraokePath.replace(".vtt", ".ass");
        const assAbsPath = path.join(UPLOAD_DIR, assPath);
        fs.writeFileSync(assAbsPath, assContent, "utf8");
        srtAbs = assAbsPath;
      } else {
        console.log(`📝 Generating normal subtitle for task ${id}...`);
        // Only generate SRT format for FFmpeg
        const { srt_path } = await subtitleApp.generateVietnameseSubtitle(id, "srt");
        if (!srt_path) {
          throw new Error("Failed to generate SRT subtitle for export");
        }
        // Normalize path - remove /uploads/ prefix since UPLOAD_DIR already points to uploads
        const normalizedSrtPath = srt_path.startsWith("/uploads/") ? srt_path.substring(9) : srt_path;
        srtAbs = path.join(UPLOAD_DIR, normalizedSrtPath);
      }
      console.log(`✅ Subtitle ready: ${srtAbs}`);
    }

    // Build FFmpeg command
    const ffmpegArgs = ["-y", "-i", videoAbs];

    // Add TTS audio input
    if (includeTTS && ttsAbs) {
      ffmpegArgs.push("-i", ttsAbs);
    }

    // Video filters
    const videoFilters = [];
    if (includeSubtitle && srtAbs) {
      // Use relative path from project root for FFmpeg subtitle filter
      const relativeSrtPath = path.relative(process.cwd(), srtAbs);
      
      // Use different filter based on subtitle type
      let subtitleFilter;
      if (subtitleStyle === "karaoke" && srtAbs.endsWith('.ass')) {
        // ASS format with built-in styling - no force_style needed
        subtitleFilter = `ass='${relativeSrtPath}'`;
      } else {
        // SRT format with manual styling
        subtitleFilter = `subtitles='${relativeSrtPath}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&Hffffff,BackColour=&H80000000,BorderStyle=3,Outline=2'`;
      }
      videoFilters.push(subtitleFilter);
    }

    // Audio and video mapping  
    if (includeTTS && ttsAbs) {
      if (muteOriginalAudio) {
        // Use only TTS audio (video duration will be limited by -shortest flag)
        console.log("🔇 Original audio muted - using TTS only");
        ffmpegArgs.push("-map", "1:a"); // Use TTS audio directly
      } else {
        // Mix original audio with TTS (video duration will be limited by -shortest flag)
        // Original audio: 30% volume, TTS: 100% volume for clear narration
        console.log("🎵 Mixing original audio (30%) with TTS (100%)");
        ffmpegArgs.push("-filter_complex", "[0:a]volume=0.3[orig];[1:a]volume=1.0[tts];[orig][tts]amix=inputs=2:duration=shortest:dropout_transition=3[aout]");
        ffmpegArgs.push("-map", "[aout]");
      }
      
      if (videoFilters.length > 0) {
        ffmpegArgs.push("-vf", videoFilters.join(","));
      }
      ffmpegArgs.push("-map", "0:v");
    } else {
      // No TTS mixing
      if (videoFilters.length > 0) {
        ffmpegArgs.push("-vf", videoFilters.join(","));
      }
      ffmpegArgs.push("-map", "0:v", "-map", "0:a");
    }

    // Video codec and output
    ffmpegArgs.push("-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac");
    
    // Add -shortest flag when using TTS to ensure output duration matches video
    if (includeTTS && ttsAbs) {
      ffmpegArgs.push("-shortest");
    }
    
    ffmpegArgs.push(outAbs);

    console.log(`🔥 Full FFmpeg command:`);
    console.log(`${FFMPEG} ${ffmpegArgs.join(" ")}`);
    console.log(`📂 Input video: ${videoAbs}`);
    console.log(`📂 Output video: ${outAbs}`);
    if (srtAbs) console.log(`📂 Subtitle file: ${srtAbs} (${srtAbs.endsWith('.ass') ? 'ASS karaoke' : 'SRT'})`);
    if (ttsAbs) console.log(`📂 TTS audio: ${ttsAbs}`);

    // Verify all input files exist
    if (!fs.existsSync(videoAbs)) {
      throw new Error(`Input video not found: ${videoAbs}`);
    }
    if (srtAbs && !fs.existsSync(srtAbs)) {
      throw new Error(`Subtitle file not found: ${srtAbs}`);
    }
    if (ttsAbs && !fs.existsSync(ttsAbs)) {
      throw new Error(`TTS audio file not found: ${ttsAbs}`);
    }

    console.log(`🔥 Starting FFmpeg with args:`, ffmpegArgs.slice(-10)); // Log last 10 args for safety

    await new Promise<void>((resolve, reject) => {
      const ff = spawn(FFMPEG, ffmpegArgs);

      let stderrOutput = "";

      ff.on("error", (err) => {
        console.error(`❌ FFmpeg spawn error:`, err);
        reject(err);
      });

      ff.stderr.on("data", (data) => {
        const output = data.toString();
        stderrOutput += output;
        console.log(`FFmpeg stderr: ${output}`);
      });

      ff.stdout.on("data", (data) => {
        console.log(`FFmpeg stdout: ${data.toString()}`);
      });

      ff.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error(`❌ FFmpeg failed with exit code ${code}`);
          console.error(`Full stderr output:`, stderrOutput);
          console.error(`Full command:`, [FFMPEG, ...ffmpegArgs].join(" "));
          reject(new Error(`FFmpeg exit ${code}: ${stderrOutput.slice(-500)}`)); // Last 500 chars of error
        }
      });
    });

    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Video export completed for task ${id} in ${duration.toFixed(2)}s`);

    return createResponse(
      {
        storage_path: outRel,
        type: suffix.replace("_", ""),
        options: { includeTTS, includeSubtitle, subtitleStyle, muteOriginalAudio, ttsVoice, ttsSpeed },
      },
      "Exported"
    );
  } catch (e) {
    console.error(`❌ Video export failed for task ${id}:`, e);
    return createResponse({ error: "Export failed" }, "Export error", 500, false);
  }
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
