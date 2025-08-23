import { NextRequest } from "next/server";
import path from "path";
import fs from "fs";
import { callOpenAITextToSpeech } from "@/lib/modules/video_processing/applications/subtitle_app";

const SAMPLE_TEXT = "Xin chào! Tôi là trợ lý AI thuyết minh video của bạn. Hôm nay chúng ta sẽ cùng khám phá một nội dung thú vị.";

const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export async function GET(req: NextRequest, { params }: any) {
  try {
    const resolvedParams = await params;
    const voice = resolvedParams?.voice;
    
    // Validate voice parameter
    if (!voice || !VALID_VOICES.includes(voice)) {
      return new Response("Invalid voice", { status: 400 });
    }
    
    const samplePath = path.join(process.cwd(), 'public', 'samples', 'voices', `${voice}.mp3`);
    
    // If file exists, serve it directly
    if (fs.existsSync(samplePath)) {
      console.log(`📂 Serving existing sample: ${voice}.mp3`);
      const fileBuffer = fs.readFileSync(samplePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        },
      });
    }
    
    // Generate sample on-demand
    console.log(`🎤 Generating voice sample on-demand: ${voice}`);
    
    // Ensure directory exists
    const sampleDir = path.dirname(samplePath);
    if (!fs.existsSync(sampleDir)) {
      fs.mkdirSync(sampleDir, { recursive: true });
    }
    
    try {
      // Generate TTS sample
      await callOpenAITextToSpeech(SAMPLE_TEXT, samplePath, { voice, speed: 1.0 });
      
      console.log(`✅ Generated voice sample: ${voice}.mp3`);
      
      // Serve the newly generated file
      const fileBuffer = fs.readFileSync(samplePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
      
    } catch (ttsError) {
      console.error(`❌ Failed to generate TTS sample for ${voice}:`, ttsError);
      return new Response("TTS generation failed", { status: 500 });
    }
    
  } catch (error) {
    console.error("❌ Voice sample endpoint error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}