import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

export const runtime = 'nodejs';

async function getHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = Number(params?.id);
  const videos = await videoTaskRepo.listVideosForTask(taskId);
  // Normally we'd check for existing vi track
  return createResponse(videos, "OK");
}

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = Number(params?.id);
  const result = await subtitleApp.generateVietnameseSubtitle(taskId);
  return createResponse(result, "Created");
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
