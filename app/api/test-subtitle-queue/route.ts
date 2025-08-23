import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { subtitleQueue } from "@/lib/modules/video_processing/subtitle_queue";

async function getHandler(req: NextRequest) {
  const status = subtitleQueue.getQueueStatus();

  return createResponse(
    {
      queue: status,
      message: status.processing ? "Subtitle generation in progress" : "Queue idle",
      timestamp: new Date().toISOString(),
    },
    "OK"
  );
}

async function postHandler(req: NextRequest) {
  try {
    const { taskId, videoId, priority = "normal" } = await req.json();

    if (!taskId || !videoId) {
      return createResponse(null, "taskId and videoId are required", 400);
    }

    await subtitleQueue.addJob(Number(taskId), Number(videoId), priority);

    return createResponse(
      {
        message: `Subtitle job queued for task ${taskId}`,
        queueLength: subtitleQueue.getQueueStatus().queueLength,
      },
      "Queued"
    );
  } catch (error) {
    return createResponse(null, "Invalid request body", 400);
  }
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
