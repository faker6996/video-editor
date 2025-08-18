// app/api/auth/logout/route.ts
import { JwtPayload, verifyJwt } from "@/lib/utils/jwt";
import { invalidateUser } from "@/lib/cache/user";
import { createResponse } from "@/lib/utils/response";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { NextRequest } from "next/server";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";

async function handler(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (accessToken) {
    try {
      const payload = verifyJwt(accessToken);
      if (payload?.sub) {
        await invalidateUser(Number(payload.sub));
        
        // Revoke all refresh tokens for this user
        await refreshTokenApp.revokeAllUserTokens(Number(payload.sub));
      }
    } catch {}
  }

  // Also revoke the specific refresh token if available
  if (refreshToken) {
    try {
      await refreshTokenApp.revokeRefreshToken(refreshToken);
    } catch {}
  }

  const res = createResponse(null, "Đăng xuất thành công");
  const sameSite = process.env.NODE_ENV === "production" ? "none" : "lax";
  const cookieDomain = process.env.NODE_ENV === "production" ? ".aistudio.com.vn" : undefined;

  // Clear both cookies via cookies API
  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    expires: new Date(0),
  });
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    expires: new Date(0),
  });
  // Clear role cookie
  res.cookies.set("role", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    expires: new Date(0),
  });

  return res;
}

export const POST = withApiHandler(handler);
