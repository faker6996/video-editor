import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { NextRequest } from "next/server";
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

async function postHandler(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return createResponse(null, 'No file', 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create dated path: origin_videos/YYYY/MM/DD/<filename>
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const destRelDir = `origin_videos/${year}/${month}/${day}`;
  const destAbsDir = path.join(UPLOAD_DIR, destRelDir);
  fs.mkdirSync(destAbsDir, { recursive: true });

  const base = (file.name || 'video').replace(/[^a-zA-Z0-9_\.-]/g, '_');
  const ts = Date.now();
  const destRelPath = `/uploads/${destRelDir}/${ts}_${base}`;  // Add /uploads/ prefix for DB storage
  const destAbsPath = path.join(UPLOAD_DIR, destRelDir, `${ts}_${base}`);

  console.log(`📁 Video upload paths:`);
  console.log(`  - UPLOAD_DIR: ${UPLOAD_DIR}`);
  console.log(`  - destRelDir: ${destRelDir}`);
  console.log(`  - destAbsDir: ${destAbsDir}`);
  console.log(`  - destAbsPath: ${destAbsPath}`);
  console.log(`  - destRelPath (for DB): ${destRelPath}`);

  fs.writeFileSync(destAbsPath, buffer);
  console.log(`✅ Video saved successfully to: ${destAbsPath}`);

  // Return relative path to be stored in DB
  return createResponse({ storage_path: destRelPath, filename: base, size: buffer.length, mime: file.type }, 'Uploaded');
}

export const POST = withApiHandler(postHandler);

