/**
 * ENUMS CENTRALISÉS
 * Source unique de vérité pour tous les énumerations
 */

// ========== RÔLES UTILISATEUR ==========
export const USER_ROLES = [
  'SUPER_ADMIN',
  'ENTREPRISE_ADMIN',
  'ENTREPRISE_MANAGER',
  'ENTREPRISE_VIEWER',
  'CLIENT',
  'EMETTEUR'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type BuyerRole = Extract<UserRole, 'CLIENT' | 'EMETTEUR'>;

export const ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ENTREPRISE_ADMIN', 'ENTREPRISE_MANAGER'];

export const VIEWER_ROLES: readonly UserRole[] = ['ENTREPRISE_VIEWER'];

// ========== STATUTS COMPTE ==========
export const ACCOUNT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'DISABLED',
  'EXPIRED',
  'REQUESTED',
  'REJECTED'
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// ========== STATUTS DEMANDE ==========
export const DEMANDE_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PENDING'
] as const;

export type DemandeStatus = (typeof DEMANDE_STATUSES)[number];

// ========== STATUTS FACTURE ==========
export const FACTURE_STATUSES = [
  'DRAFT',
  'SIGNED',
  'SENT',
  'PAID',
  'REJECTED',
  'CANCELLED'
] as const;

export type FactureStatus = (typeof FACTURE_STATUSES)[number];

// ========== FORME JURIDIQUE ==========
export const FORMES_JURIDIQUES = [
  'SARL',
  'SA',
  'SUARL',
  'SNC',
  'SCS',
  'SCA',
  'EI',
  'SOCIETE_CIVILE'
] as const;

export type FormeJuridique = (typeof FORMES_JURIDIQUES)[number];

// ========== RÉGION TUNISIE ========== 
export const REGIONS_TUNISIE = [
  'ARIANA',
  'BEJA',
  'BEN_AROUS',
  'BIZERTE',
  'GABES',
  'GAFSA',
  'JENDOUBA',
  'KAIROUAN',
  'KASSERINE',
  'KEBILI',
  'KEF',
  'MAHDIA',
  'MANOUBA',
  'MEDENINE',
  'MONASTIR',
  'NABEUL',
  'SFAX',
  'SIDI_BOUZID',
  'SILIANA',
  'SOUSSE',
  'TATAOUINE',
  'TOZEUR',
  'TUNIS',
  'ZAGHOUAN'
] as const;

export type RegionTunisie = (typeof REGIONS_TUNISIE)[number];

// ========== TYPE VALIDATIONS ==========
export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

export function isAccountStatus(value: string | null | undefined): value is AccountStatus {
  return !!value && (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function isDemandeStatus(value: string | null | undefined): value is DemandeStatus {
  return !!value && (DEMANDE_STATUSES as readonly string[]).includes(value);
}

export function isFactureStatus(value: string | null | undefined): value is FactureStatus {
  return !!value && (FACTURE_STATUSES as readonly string[]).includes(value);
}

export function isRegionTunisie(value: string | null | undefined): value is RegionTunisie {
  return !!value && (REGIONS_TUNISIE as readonly string[]).includes(value);
}

// ========== NORMALIZATION ==========
export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (!role) return 'CLIENT';
  if (isUserRole(role)) return role;

  const normalized = role.trim().toUpperCase().replace(/^ROLE_/, '');
  if (isUserRole(normalized)) return normalized;

  if (normalized === 'ADMIN') return 'SUPER_ADMIN';
  if (normalized === 'USER') return 'CLIENT';
  return 'CLIENT';
}
