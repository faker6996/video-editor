import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const id = Number(params?.id);
  if (!id || Number.isNaN(id)) return createResponse(null, "Invalid task id", 400);

  try {
    const { vtt_path } = await subtitleApp.generateVietnameseSubtitle(id);
    return createResponse({ storage_path: vtt_path }, "Generated");
  } catch (e: any) {
    return createResponse({ error: e?.message || "Failed" }, "Failed", 500, false);
  }
}

export const POST = withApiHandler(postHandler);

