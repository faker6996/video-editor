import { baseRepo } from "@/lib/modules/common/base_repo";
import { safeQuery } from "@/lib/modules/common/safe_query";
import { SubscriptionPlan, UserSubscription, UserRole } from "@/lib/models";
import { ROLE_ORDER, type AppRole } from "@/lib/constants/role";

export const subscriptionRepo = {
  async listActivePlans(): Promise<SubscriptionPlan[]> {
    const rows = await baseRepo.findManyByFields<SubscriptionPlan>(SubscriptionPlan, { is_active: true }, {
      orderBy: ["price_cents"],
      allowedOrderFields: ["id", "created_at", "price_cents"],
      orderDirections: { price_cents: "ASC" }
    });
    return rows;
  },

  async getPlanByCode(code: string): Promise<SubscriptionPlan | null> {
    return baseRepo.getByField<SubscriptionPlan>(SubscriptionPlan, "code" as any, code);
  },

  async getUserActiveSubscription(userId: number): Promise<UserSubscription | null> {
    // active and not expired
    const nowIso = new Date().toISOString();
    const sql = `
      SELECT * FROM ${UserSubscription.table}
      WHERE user_id = $1
        AND status = 'active'
        AND (end_at IS NULL OR end_at > $2)
      ORDER BY start_at DESC
      LIMIT 1
    `;
    const { rows } = await safeQuery(sql, [userId, nowIso]);
    return rows[0] ? new UserSubscription(rows[0]) : null;
  },

  async listActiveUserRoles(userId: number): Promise<UserRole[]> {
    const nowIso = new Date().toISOString();
    const sql = `
      SELECT * FROM ${UserRole.table}
      WHERE user_id = $1
        AND (effective_from IS NULL OR effective_from <= $2)
        AND (expires_at IS NULL OR expires_at > $2)
      ORDER BY created_at DESC
    `;
    const { rows } = await safeQuery(sql, [userId, nowIso]);
    return rows.map((r) => new UserRole(r));
  },

  async setVipRole(userId: number, expiresAt: Date | null): Promise<UserRole> {
    const role = new UserRole({
      user_id: userId,
      role: 'vip',
      effective_from: new Date(),
      expires_at: expiresAt ?? null,
    });
    return baseRepo.insert<UserRole>(role);
  },

  async createSubscription(
    userId: number,
    plan: SubscriptionPlan,
    gateway: string
  ): Promise<{ subscription: UserSubscription }>{
    const start = new Date();
    let end: Date | null = null;
    if (!plan.is_lifetime) {
      const days = Number(plan.duration_days || 0);
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const sub = new UserSubscription({
      user_id: userId,
      plan_id: plan.id,
      status: 'active',
      start_at: start,
      end_at: end ?? null,
      auto_renew: false,
      payment_gateway: gateway,
      transaction_id: `MOCK-${Date.now()}`,
    });

    const created = await baseRepo.insert<UserSubscription>(sub);
    // Grant VIP role aligned with subscription end
    await this.setVipRole(userId, end);
    return { subscription: created };
  },

  async getActiveRole(userId: number): Promise<AppRole> {
    const roles = await this.listActiveUserRoles(userId);
    if (roles.length) {
      // choose highest priority by ROLE_ORDER
      const highest = roles
        .map((r) => r.role as AppRole)
        .sort((a, b) => ROLE_ORDER.indexOf(b) - ROLE_ORDER.indexOf(a))[0];
      return highest || 'standard';
    }
    // derive from subscription if no explicit role
    const activeSub = await this.getUserActiveSubscription(userId);
    if (activeSub) return 'vip';
    return 'standard';
  },
};

