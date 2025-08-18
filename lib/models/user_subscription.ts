export class UserSubscription {
  id?: number;
  user_id?: number;
  plan_id?: number;
  status?: 'active' | 'expired' | 'canceled' | 'pending';
  start_at?: Date;
  end_at?: Date | null;
  cancel_at?: Date | null;
  auto_renew?: boolean;
  payment_gateway?: string;
  transaction_id?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;

  static table = 'user_subscriptions';
  static columns = {
    id: 'id',
    user_id: 'user_id',
    plan_id: 'plan_id',
    status: 'status',
    start_at: 'start_at',
    end_at: 'end_at',
    cancel_at: 'cancel_at',
    auto_renew: 'auto_renew',
    payment_gateway: 'payment_gateway',
    transaction_id: 'transaction_id',
    metadata: 'metadata',
    created_at: 'created_at',
    updated_at: 'updated_at',
  } as const;

  constructor(data: Partial<UserSubscription> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.start_at === 'string') this.start_at = new Date(data.start_at);
      if (typeof data.end_at === 'string') this.end_at = new Date(data.end_at);
      if (typeof data.cancel_at === 'string') this.cancel_at = new Date(data.cancel_at);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

