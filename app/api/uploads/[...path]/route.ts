import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function GET(req: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const rel = "/" + resolvedParams.path.join("/");
    console.log(`📁 Upload API: Requested path: ${rel}`);
    console.log(`📁 Upload API: UPLOAD_DIR: ${UPLOAD_DIR}`);
    
    if (!rel.startsWith("/uploads/")) {
      console.log(`❌ Path doesn't start with /uploads/`);
      return new Response("Not found", { status: 404 });
    }
    
    // Remove /uploads/ prefix since UPLOAD_DIR already points to uploads folder
    const normalizedPath = rel.substring(9); // Remove "/uploads/" prefix
    const abs = path.join(UPLOAD_DIR, normalizedPath);
    console.log(`📁 Upload API: Normalized path: ${normalizedPath}`);
    console.log(`📁 Upload API: Absolute path: ${abs}`);
    console.log(`📁 Upload API: File exists: ${fs.existsSync(abs) ? 'YES' : 'NO'}`);
    
    if (!fs.existsSync(abs)) return new Response("Not found", { status: 404 });

    const stat = fs.statSync(abs);
    if (stat.isDirectory()) return new Response("Not found", { status: 404 });

    const file = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    const type =
      ext === ".vtt"
        ? "text/vtt; charset=utf-8"
        : ext === ".srt"
        ? "application/x-subrip; charset=utf-8"
        : ext === ".mp4"
        ? "video/mp4"
        : "application/octet-stream";

    return new Response(file, { status: 200, headers: { "Content-Type": type } });
  } catch (e) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
