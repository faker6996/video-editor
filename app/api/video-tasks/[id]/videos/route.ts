import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskApp } from "@/lib/modules/video_task/applications/video_task_app";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";

function getTaskId(req: NextRequest, context?: any): number {
  const fromCtx = context?.params?.id;
  if (fromCtx) return Number(fromCtx);
  const m = req.nextUrl.pathname.match(/video-tasks\/(\d+)\/videos/);
  if (!m) return NaN;
  return Number(m[1]);
}

async function getHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = getTaskId(req, context);
  if (!taskId || Number.isNaN(taskId)) return createResponse(null, "Invalid task id", 400);
  const videos = await videoTaskRepo.listVideosForTask(taskId);
  return createResponse(videos, "OK");
}

async function postHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = getTaskId(req, context);
  if (!taskId || Number.isNaN(taskId)) return createResponse(null, "Invalid task id", 400);
  const body = await req.json();
  const { source_url, storage_path, filename, format, duration_seconds } = body || {};
  const video = await videoTaskApp.addVideoToTask(taskId, user.id, {
    source_url,
    storage_path,
    filename,
    format,
    duration_seconds,
  });
  return createResponse(video, "Created");
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);

