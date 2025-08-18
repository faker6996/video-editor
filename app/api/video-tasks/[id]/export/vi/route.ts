import { NextRequest } from "next/server";
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

async function getHandler(req: NextRequest, { params }: any) {
  // We return 405 for GET to avoid heavy work; use POST to trigger export
  return createResponse(null, 'Method Not Allowed', 405);
}

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, 'Unauthorized', 401);
  const id = Number(params?.id);
  const videos = await videoTaskRepo.listVideosForTask(id);
  if (!videos.length) return createResponse(null, 'No videos', 400);
  const primary = videos.find(v => v.is_primary) || videos[0];
  const videoAbs = primary.storage_path ? path.join(UPLOAD_DIR, primary.storage_path) : '';
  if (!videoAbs || !fs.existsSync(videoAbs)) return createResponse(null, 'Primary video not found on disk', 400);

  // Ensure subtitles exist
  const { vtt_path, srt_path } = await subtitleApp.generateVietnameseSubtitle(id);
  const srtAbs = path.join(UPLOAD_DIR, srt_path);

  // Output path
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const outRelDir = `/uploads/exports/${year}/${month}/${day}`;
  const outAbsDir = path.join(UPLOAD_DIR, outRelDir);
  if (!fs.existsSync(outAbsDir)) fs.mkdirSync(outAbsDir, { recursive: true });
  const outRel = `${outRelDir}/task_${id}_vi.mp4`;
  const outAbs = path.join(UPLOAD_DIR, outRel);

  // Burn subtitles using ffmpeg
  try {
    await new Promise<void>((resolve, reject) => {
      const ff = spawn(FFMPEG, ['-y', '-i', videoAbs, '-vf', `subtitles=${srtAbs.replace(/:/g,'\\:')}`, '-c:a', 'copy', outAbs]);
      ff.on('error', reject);
      ff.stderr.on('data', () => {});
      ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
    });
  } catch (e) {
    return createResponse({ error: 'FFmpeg not available or failed' }, 'FFmpeg error', 501, false);
  }

  return createResponse({ storage_path: outRel }, 'Exported');
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);

