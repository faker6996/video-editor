import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subscriptionApp } from "@/lib/modules/subscription/applications/subscription_app";

async function getHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const sub = await subscriptionApp.getActiveSubscription(user.id);
  return createResponse(sub, "OK");
}

async function postHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const { planCode, gateway = 'momo' } = await req.json();

  const { subscription } = await subscriptionApp.createSubscription(user.id, planCode, gateway);

  // Set role cookie
  const role = await subscriptionApp.getActiveRole(user.id);
  const res = createResponse(subscription, "Subscription created");

  const sameSite = process.env.NODE_ENV === "production" ? "none" : "lax";
  const cookieDomain = process.env.NODE_ENV === "production" ? ".aistudio.com.vn" : undefined;
  res.cookies.set("role", role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: sameSite as any,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return res;
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);

