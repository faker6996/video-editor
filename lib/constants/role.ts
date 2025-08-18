export type AppRole = 'admin' | 'vip' | 'standard';

export const ROLES: Record<string, AppRole> = {
  ADMIN: 'admin',
  VIP: 'vip',
  STANDARD: 'standard',
};

export const ROLE_ORDER: AppRole[] = ['standard', 'vip', 'admin'];
