export class SubscriptionPlan {
  id?: number;
  code?: string; // VIP_WEEK, VIP_MONTH, VIP_YEAR, VIP_LIFETIME
  name?: string;
  description?: string;
  duration_days?: number | null;
  is_lifetime?: boolean;
  price_cents?: number;
  currency?: string;
  features?: Record<string, any>;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  static table = 'subscription_plans';
  static columns = {
    id: 'id',
    code: 'code',
    name: 'name',
    description: 'description',
    duration_days: 'duration_days',
    is_lifetime: 'is_lifetime',
    price_cents: 'price_cents',
    currency: 'currency',
    features: 'features',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at',
  } as const;

  constructor(data: Partial<SubscriptionPlan> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

