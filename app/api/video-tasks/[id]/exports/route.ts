import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

async function getHandler(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  
  const resolvedParams = await params;
  const taskId = Number(resolvedParams?.id);
  
  try {
    // Look for exported videos in exports directory
    const exportsDir = path.join(UPLOAD_DIR, "exports");
    const exportedVideos: Array<{
      filename: string;
      path: string;
      size: number;
      created: string;
      type: string;
    }> = [];
    
    if (fs.existsSync(exportsDir)) {
      // Recursively search through year/month/day directories
      const searchDir = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            searchDir(fullPath);
          } else if (entry.isFile() && entry.name.includes(`task_${taskId}`) && entry.name.endsWith('.mp4')) {
            const stats = fs.statSync(fullPath);
            const relativePath = path.relative(UPLOAD_DIR, fullPath);
            const urlPath = `/uploads/${relativePath.replace(/\\/g, '/')}`;
            
            // Parse export type from filename
            let type = "unknown";
            if (entry.name.includes('_vi_tts_')) {
              if (entry.name.includes('_sub_')) {
                type = entry.name.includes('_mute') ? "tts_sub_mute" : "tts_sub_mix";
              } else {
                type = "tts_only";
              }
            } else if (entry.name.includes('_sub_')) {
              type = "subtitle_only";
            }
            
            exportedVideos.push({
              filename: entry.name,
              path: urlPath,
              size: stats.size,
              created: stats.mtime.toISOString(),
              type: type
            });
          }
        }
      };
      
      searchDir(exportsDir);
    }
    
    // Sort by creation time, newest first
    exportedVideos.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    return createResponse(exportedVideos);
    
  } catch (error) {
    console.error("❌ Failed to list exported videos:", error);
    return createResponse(null, "Failed to list exported videos", 500);
  }
}

export const GET = withApiHandler(getHandler);