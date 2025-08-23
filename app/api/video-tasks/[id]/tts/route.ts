import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

// Increase timeout for TTS generation
export const maxDuration = 60; // 60 seconds

async function postHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const resolvedParams = await params;
  const id = Number(resolvedParams?.id);
  if (!id || Number.isNaN(id)) return createResponse(null, "Invalid task id", 400);

  try {
    console.log(`🎙️ Starting TTS generation for task ${id}...`);
    const startTime = Date.now();

    const { audio_path } = await subtitleApp.generateVietnameseTTS(id);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ TTS generation completed for task ${id} in ${duration.toFixed(2)}s`);

    return createResponse({ audio_path }, "TTS Generated");
  } catch (e: any) {
    console.error(`❌ TTS generation failed for task ${id}:`, e?.message);
    return createResponse({ error: e?.message || "Failed" }, "Failed", 500, false);
  }
}

export const POST = withApiHandler(postHandler);
