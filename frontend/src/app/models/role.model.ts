export const USER_ROLES = [
  'SUPER_ADMIN',
  'ENTREPRISE_ADMIN',
  'ENTREPRISE_VIEWER',
  'CLIENT',
  'EMETTEUR'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type BuyerRole = Extract<UserRole, 'CLIENT' | 'EMETTEUR'>;

export const ACCOUNT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'DISABLED',
  'EXPIRED',
  'REQUESTED',
  'REJECTED'
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ENTREPRISE_ADMIN'];

export interface RoleRouteData {
  roles?: readonly UserRole[];
  requireAll?: boolean;
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (!role) return 'CLIENT';

  if (isUserRole(role)) return role;

  if (role === 'ADMIN') return 'SUPER_ADMIN';
  if (role === 'USER') return 'CLIENT';

  return 'CLIENT';
}