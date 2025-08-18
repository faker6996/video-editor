import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const id = Number(params?.id);
  const video = await videoTaskRepo.getVideoById(id);
  if (!video) return createResponse(null, "Not found", 404);
  await videoTaskRepo.setPrimaryVideo(id);
  return createResponse(null, "OK");
}

export const POST = withApiHandler(postHandler);

