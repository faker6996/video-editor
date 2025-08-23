import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

async function getHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);

  const resolvedParams = await params;
  const taskId = Number(resolvedParams?.id);

  if (!taskId) return createResponse(null, "Invalid task ID", 400);

  try {
    const allSubtitles = await subtitleApp.getSubtitlesForTask(taskId);

    return createResponse(
      {
        taskId,
        videos: allSubtitles.map((item) => ({
          video: {
            id: item.video.id,
            filename: item.video.filename,
            is_primary: item.video.is_primary,
            format: item.video.format,
            duration_seconds: item.video.duration_seconds,
          },
          subtitles: item.subtitles,
        })),
      },
      "OK"
    );
  } catch (error) {
    console.error(`Error fetching all subtitles for task ${taskId}:`, error);
    return createResponse(null, "Failed to fetch subtitles", 500);
  }
}

export const GET = withApiHandler(getHandler);
