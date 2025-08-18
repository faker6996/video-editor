import { subscriptionRepo } from "@/lib/modules/subscription/repositories/subscription_repo";
import { SubscriptionPlan } from "@/lib/models";

export const subscriptionApp = {
  listPlans: () => subscriptionRepo.listActivePlans(),

  async createSubscription(userId: number, planCode: string, gateway: string) {
    const plan = await subscriptionRepo.getPlanByCode(planCode);
    if (!plan) throw new Error("Plan not found");
    return subscriptionRepo.createSubscription(userId, plan as SubscriptionPlan, gateway);
  },

  getActiveRole: (userId: number) => subscriptionRepo.getActiveRole(userId),
  getActiveSubscription: (userId: number) => subscriptionRepo.getUserActiveSubscription(userId),
};

