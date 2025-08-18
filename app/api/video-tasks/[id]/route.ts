import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";

function getTaskId(context?: any): number {
  const id = context?.params?.id;
  return Number(id);
}

async function getHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = getTaskId(context);
  const task = await videoTaskRepo.getTaskById(taskId);
  if (!task || task.user_id !== user.id) return createResponse(null, "Not found", 404);
  return createResponse(task, "OK");
}

async function putHandler(req: NextRequest, context?: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const taskId = getTaskId(context);
  const existing = await videoTaskRepo.getTaskById(taskId);
  if (!existing || existing.user_id !== user.id) return createResponse(null, "Not found", 404);
  const body = await req.json();
  const { title, description, status } = body || {};
  const updated = await videoTaskRepo.updateTask({ id: taskId, title, description, status });
  return createResponse(updated, "Updated");
}

export const GET = withApiHandler(getHandler);
export const PUT = withApiHandler(putHandler);

