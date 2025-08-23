import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskApp } from "@/lib/modules/video_task/applications/video_task_app";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { subtitleQueue } from "@/lib/modules/video_processing/subtitle_queue";

async function getTaskId(req: NextRequest, context?: any): Promise<number> {
  if (context?.params) {
    const params = await context.params;
    const fromCtx = params?.id;
    if (fromCtx) return Number(fromCtx);
  }
  const m = req.nextUrl.pathname.match(/video-tasks\/(\d+)\/videos/);
  if (!m) return NaN;
  return Number(m[1]);
}

async function getHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = await getTaskId(req, context);
  if (!taskId || Number.isNaN(taskId)) return createResponse(null, "Invalid task id", 400);
  const videos = await videoTaskRepo.listVideosForTask(taskId);
  return createResponse(videos, "OK");
}

async function postHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = await getTaskId(req, context);
  if (!taskId || Number.isNaN(taskId)) return createResponse(null, "Invalid task id", 400);
  const body = await req.json();
  const { source_url, storage_path, filename, format, duration_seconds, auto_generate_subtitles = false } = body || {};

  const video = await videoTaskApp.addVideoToTask(taskId, user.id, {
    source_url,
    storage_path,
    filename,
    format,
    duration_seconds,
  });

  // Auto-generate subtitles if explicitly enabled (disabled by default)
  if (auto_generate_subtitles && video && video.id && storage_path) {
    try {
      console.log(`🎬 Queuing auto-subtitle generation for task ${taskId}, video ${video.id}`);
      await subtitleQueue.addJob(taskId, video.id, "normal");
    } catch (error) {
      console.error("Error queuing subtitle generation:", error);
      // Don't fail the video upload if subtitle generation setup fails
    }
  } else {
    console.log(`📹 Video uploaded without auto-subtitle generation`);
  }

  return createResponse(
    {
      ...video,
      subtitle_status: auto_generate_subtitles ? "queued" : "pending", // "pending" = chờ export để generate
    },
    "Created"
  );
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
