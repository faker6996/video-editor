import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/utils/error";
import { createErrorResponse, createResponse } from "./response";

// Wraps a route handler and preserves Next.js context (params/searchParams).
// Supports handlers with signature: (req, context?) => NextResponse
export function withApiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const res = await handler(req, context);

      // Nếu không phải JSON → trả thẳng
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) return res;

      const body = await res.clone().json();
      const okShape = body && typeof body === "object" && "success" in body && "message" in body && "data" in body;

      return okShape ? res : createResponse(body, "OK", res.status);
    } catch (err) {
      /* ---------- ①  LỖI NGHIỆP VỤ ---------- */
      if (err instanceof ApiError) {
        // Giữ nguyên status code 401 cho lỗi authentication để trigger chuyển hướng login
        if (err.status === 401) {
          return createErrorResponse(err.message, 401);
        }
        
        // Các lỗi khác vẫn trả HTTP 200 với success=false
        return createResponse(
          err.data ?? null,
          err.message,
          200, // luôn 200
          false // success = false
        );
      }

      /* ---------- ②  LỖI HỆ THỐNG ---------- */
      console.error("[Internal Error]", err);

      // Dev xem chi tiết, Prod giấu
      const message = process.env.NODE_ENV !== "production" ? (err as Error).message : "Internal Server Error";

      // HTTP 500, success=false
      return createErrorResponse(message, 500);
    }
  };
}
