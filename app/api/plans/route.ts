import { withApiHandler } from "@/lib/utils/withApiHandler";
import { createResponse } from "@/lib/utils/response";
import { subscriptionApp } from "@/lib/modules/subscription/applications/subscription_app";

async function getHandler() {
  const plans = await subscriptionApp.listPlans();
  return createResponse(plans, "OK");
}

export const GET = withApiHandler(getHandler);

