import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { baseRepo } from "@/lib/modules/common/base_repo";
import { SubtitleTrack, VideoEditSettings } from "@/lib/models";
import { TranscriptSegment, toVtt, toSrt } from "@/lib/utils/subtitle";
import { safeQuery } from "@/lib/modules/common/safe_query";

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

async function callOpenAITranscribe(urlOrPath: string): Promise<{segments: TranscriptSegment[]; language?: string}> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

  // If no API key, return fallback demo segments to keep dev flow working
  if (!apiKey) {
    return {
      segments: [
        { start: 0, end: 2.5, text: 'Xin chào, đây là phụ đề mẫu.' },
        { start: 2.6, end: 6.0, text: 'Tính năng phụ đề tiếng Việt đang hoạt động.' },
        { start: 6.1, end: 10.0, text: 'Bạn có thể tải xuống file phụ đề.' },
      ],
      language: 'vi',
    };
  }

  // Only support local file paths (we store to disk after upload)
  const absPath = urlOrPath.startsWith('/') || urlOrPath.startsWith('./') || urlOrPath.includes('uploads')
    ? urlOrPath
    : path.join(process.env.UPLOAD_DIR || './uploads', urlOrPath);
  if (!fs.existsSync(absPath)) {
    throw new Error('Audio/video file not found for transcription');
  }

  // Build multipart form for OpenAI audio transcription
  const form = new FormData();
  // @ts-ignore - filename is supported by undici FormData
  form.append('file', fs.createReadStream(absPath), path.basename(absPath));
  form.append('model', model);
  form.append('response_format', 'verbose_json');

  const res = await fetch(`${apiBase}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  });
  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`OpenAI transcribe failed: ${res.status} ${errTxt}`);
  }
  const data: any = await res.json();
  const segments: TranscriptSegment[] = (data.segments || []).map((s: any) => ({ start: s.start, end: s.end, text: s.text }));
  const language: string | undefined = data.language;

  // Optional: translate to Vietnamese using an LLM if configured
  const translateModel = process.env.OPENAI_TRANSLATE_MODEL; // e.g., 'gpt-4o-mini'
  if (translateModel && language && language !== 'vi' && segments.length) {
    // Pack texts into a single JSON for efficient translation preserving segmentation
    const texts = segments.map((s) => s.text);
    const prompt = `Translate the following array of transcript segments to Vietnamese. Keep array length and order. Return JSON array of strings only.\n\n${JSON.stringify(texts)}`;
    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: translateModel,
        messages: [
          { role: 'system', content: 'You are a precise subtitle translator.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });
    if (resp.ok) {
      const out: any = await resp.json();
      const content = out.choices?.[0]?.message?.content;
      try {
        const arr = JSON.parse(content);
        if (Array.isArray(arr) && arr.length === segments.length) {
          for (let i = 0; i < segments.length; i++) segments[i].text = arr[i];
        }
      } catch {}
    }
  }

  return { segments, language };
}

async function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export const subtitleApp = {
  async generateVietnameseSubtitle(taskId: number) {
    const videos = await videoTaskRepo.listVideosForTask(taskId);
    if (!videos.length) throw new Error('No videos in task');
    const primary = videos.find(v => v.is_primary) || videos[0];

    const source = primary.storage_path ? path.join(UPLOAD_DIR, primary.storage_path) : (primary.source_url || '');
    const { segments, language } = await callOpenAITranscribe(source);
    const vtt = toVtt(segments);
    const srt = toSrt(segments);

    // Save file under /uploads/subtitles/YYYY/MM/DD/task_<id>.vtt
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const relDir = `/uploads/subtitles/${year}/${month}/${day}`;
    const absDir = path.join(UPLOAD_DIR, relDir);
    await ensureDir(absDir);
    const filenameVtt = `task_${taskId}_vi.vtt`;
    const relPathVtt = `${relDir}/${filenameVtt}`;
    const absPathVtt = path.join(UPLOAD_DIR, relPathVtt);
    fs.writeFileSync(absPathVtt, vtt, 'utf8');

    const filenameSrt = `task_${taskId}_vi.srt`;
    const relPathSrt = `${relDir}/${filenameSrt}`;
    const absPathSrt = path.join(UPLOAD_DIR, relPathSrt);
    fs.writeFileSync(absPathSrt, srt, 'utf8');

    // Upsert subtitle track
    const track = new SubtitleTrack({
      video_id: primary.id,
      language_code: 'vi',
      storage_path: relPathVtt,
      format: 'vtt',
      is_auto_generated: true,
    });
    const created = await baseRepo.insert<SubtitleTrack>(track);

    // Update video_edit_settings flags
    const settings = new VideoEditSettings({
      video_id: primary.id,
      enable_auto_subtitles: true,
      enable_auto_translate: true,
      current_subtitle_lang: 'vi',
      target_languages: ['vi'] as any,
    });
    await baseRepo.insert<VideoEditSettings>(settings);

    return { track: created, vtt_path: relPathVtt, srt_path: relPathSrt };
  },
};
