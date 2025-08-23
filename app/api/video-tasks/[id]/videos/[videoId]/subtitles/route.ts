import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { baseRepo } from "@/lib/modules/common/base_repo";
import { SubtitleTrack } from "@/lib/models";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

async function getHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);

  const resolvedParams = await params;
  const taskId = Number(resolvedParams?.id);
  const videoId = Number(resolvedParams?.videoId);

  if (!taskId || !videoId) return createResponse(null, "Invalid IDs", 400);

  try {
    // Get all subtitle tracks for this video
    const subtitles = await baseRepo.findManyByFields<SubtitleTrack>(SubtitleTrack, { video_id: videoId }, { orderBy: ["created_at"] });

    return createResponse(
      {
        videoId,
        taskId,
        subtitles: subtitles.map((sub) => ({
          id: sub.id,
          language_code: sub.language_code,
          format: sub.format,
          url: sub.storage_path ? `/api/uploads${sub.storage_path}` : sub.url,
          is_auto_generated: sub.is_auto_generated,
          created_at: sub.created_at,
        })),
      },
      "OK"
    );
  } catch (error) {
    console.error(`Error fetching subtitles for video ${videoId}:`, error);
    return createResponse(null, "Failed to fetch subtitles", 500);
  }
}

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);

  const resolvedParams = await params;
  const taskId = Number(resolvedParams?.id);
  const videoId = Number(resolvedParams?.videoId);

  if (!taskId || !videoId) return createResponse(null, "Invalid IDs", 400);

  const body = await req.json().catch(() => ({}));
  const { language_code = "vi", force_regenerate = false } = body;

  try {
    // Check if subtitle already exists
    const existing = await baseRepo.findManyByFields<SubtitleTrack>(SubtitleTrack, { video_id: videoId, language_code });

    if (existing.length > 0 && !force_regenerate) {
      return createResponse(
        {
          subtitle: {
            url: `/api/uploads${existing[0].storage_path}`,
            format: existing[0].format,
          },
        },
        "Subtitle already exists"
      );
    }

    // Generate subtitle for this specific video
    const { track, vtt_path } = await subtitleApp.generateSubtitleForVideo(videoId, language_code);

    return createResponse(
      {
        subtitle: {
          id: track.id,
          url: `/api/uploads${vtt_path}`,
          format: "vtt",
          language_code,
        },
      },
      "Generated"
    );
  } catch (error) {
    console.error(`Error generating subtitle for video ${videoId}:`, error);
    return createResponse(null, "Failed to generate subtitle", 500);
  }
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
