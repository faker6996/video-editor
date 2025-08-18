// app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { serialize } from "cookie";

import { userApp } from "@/lib/modules/user/applications/user_app";
import { createTokenPair } from "@/lib/utils/jwt";
import { createResponse } from "@/lib/utils/response";

import { withApiHandler } from "@/lib/utils/withApiHandler";
import { ApiError } from "@/lib/utils/error";
import { cacheUser } from "@/lib/cache/user";
import { refreshTokenApp } from "@/lib/modules/auth/refresh_token/applications/refresh_token_app";
import { applyRateLimit, registerRateLimit } from "@/lib/middlewares/auth-rate-limit";

async function handler(req: NextRequest) {
  // Apply rate limiting first
  await applyRateLimit(req, registerRateLimit);
  
  const { name, email, password } = await req.json();

  // Create new user (validation is handled in userApp.createUser)
  const newUser = await userApp.createUser({
    name,
    email,
    password,
    last_login_at: new Date().toISOString()
  });

  if (!newUser) {
    throw new ApiError("Không thể tạo tài khoản", 500);
  }

  // Generate token pair
  const { accessToken, refreshToken } = createTokenPair({
    sub: newUser.id!.toString(),
    email: newUser.email,
    name: newUser.name,
    id: newUser.id!
  }, false); // Default to not remember for new registrations

  // Store refresh token in database
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days for new users
  
  await refreshTokenApp.createRefreshToken(newUser.id!, refreshToken, refreshTokenExpiry);
  await cacheUser(newUser);
  
  const res = createResponse(null, "Đăng ký thành công");

  const cookieOptions = {
    domain: process.env.NODE_ENV === "production" ? ".aistudio.com.vn" : "localhost",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  };

  // Set both access token and refresh token
  res.headers.set("Set-Cookie", [
    serialize("access_token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    }),
    serialize("refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    })
  ].join(", "));

  return res;
}

export const POST = withApiHandler(handler);