export class Payment {
  id?: number;
  user_id?: number;
  plan_id?: number;
  amount_cents?: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'failed' | 'refunded';
  gateway?: string; // momo, zalopay, stripe, paypal
  transaction_id?: string;
  paid_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  metadata?: Record<string, any>;

  static table = 'payments';
  static columns = {
    id: 'id',
    user_id: 'user_id',
    plan_id: 'plan_id',
    amount_cents: 'amount_cents',
    currency: 'currency',
    status: 'status',
    gateway: 'gateway',
    transaction_id: 'transaction_id',
    paid_at: 'paid_at',
    created_at: 'created_at',
    updated_at: 'updated_at',
    metadata: 'metadata',
  } as const;

  constructor(data: Partial<Payment> = {}) {
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      if (typeof data.paid_at === 'string') this.paid_at = new Date(data.paid_at);
      if (typeof data.created_at === 'string') this.created_at = new Date(data.created_at);
      if (typeof data.updated_at === 'string') this.updated_at = new Date(data.updated_at);
    }
  }
}

