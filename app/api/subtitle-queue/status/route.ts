import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subtitleQueue } from "@/lib/modules/video_processing/subtitle_queue";

async function getHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);

  const status = subtitleQueue.getQueueStatus();

  return createResponse(
    {
      queue: status,
      message: status.processing ? "Subtitle generation in progress" : "Queue idle",
    },
    "OK"
  );
}

export const GET = withApiHandler(getHandler);
