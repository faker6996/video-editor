import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { getUserFromRequest } from "@/lib/utils/auth-helper";
import { subscriptionApp } from "@/lib/modules/subscription/applications/subscription_app";

async function getHandler(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user?.id) return createResponse(null, "Unauthorized", 401);
  const role = await subscriptionApp.getActiveRole(user.id);
  return createResponse({ role }, "OK");
}

export const GET = withApiHandler(getHandler);

