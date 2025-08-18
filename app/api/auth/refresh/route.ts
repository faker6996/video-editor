import { NextRequest } from "next/server";
import { createResponse } from "@/lib/utils/response";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { ApiError } from "@/lib/utils/error";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";
import { subscriptionApp } from "@/lib/modules/subscription/applications/subscription_app";
import { verifyJwt } from "@/lib/utils/jwt";

async function handler(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  
  if (!refreshToken) {
    throw new ApiError("Refresh token not found", 401);
  }

  // Use application layer to handle token refresh
  const { accessToken, refreshToken: newRefreshToken } = await refreshTokenApp.refreshAccessToken(refreshToken);

  const res = createResponse({ accessToken }, "Token refreshed successfully");

  // Set new cookies
  const cookieDomain = process.env.NODE_ENV === "production" ? ".aistudio.com.vn" : undefined;
  const sameSite = process.env.NODE_ENV === "production" ? "none" : "lax";
  res.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    maxAge: 15 * 60,
  });
  res.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    maxAge: 30 * 24 * 60 * 60,
  });

  // Also sync role cookie
  try {
    const payload = verifyJwt(accessToken);
    if (payload?.id) {
      const role = await subscriptionApp.getActiveRole(Number(payload.id));
      res.cookies.set("role", role, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: sameSite as any,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
        maxAge: 30 * 24 * 60 * 60,
      });
    }
  } catch {}

  return res;
}

export const POST = withApiHandler(handler);
