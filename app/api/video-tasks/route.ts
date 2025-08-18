import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskApp } from "@/lib/modules/video_task/applications/video_task_app";

async function getHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const tasks = await videoTaskApp.listTasksByUser(user.id);
  return createResponse(tasks, "OK");
}

async function postHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const { title, description } = await req.json();
  const task = await videoTaskApp.createTask(user.id, title, description);
  return createResponse(task, "Created");
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);

