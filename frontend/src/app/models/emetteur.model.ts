// src/app/models/emetteur.model.ts - Aligné avec le backend (camelCase)
import { UserRole } from './role.model';

export type RegionTunisie =
  | 'ARIANA' | 'BEJA' | 'BEN_AROUS' | 'BIZERTE' | 'GABES' | 'GAFSA' | 'JENDOUBA'
  | 'KAIROUAN' | 'KASSERINE' | 'KEBILI' | 'KEF' | 'MAHDIA' | 'MANOUBA' | 'MEDENINE'
  | 'MONASTIR' | 'NABEUL' | 'SFAX' | 'SIDI_BOUZID' | 'SILIANA' | 'SOUSSE' | 'TATAOUINE'
  | 'TOZEUR' | 'TUNIS' | 'ZAGHOUAN';

export type FormeJuridique =
  | 'SARL' | 'SA' | 'SUARL' | 'SNC' | 'SCS' | 'SCA' | 'EI' | 'SOCIETE_CIVILE';

export interface Emetteur {
  id: number;
  code: string;
  raisonSociale: string;
  matriculeFiscal: string;
  formeJuridique: FormeJuridique;
  adresseComplete: string;
  pays: string;
  region: RegionTunisie | string;
  email: string;
  telephone?: string;
  siteWeb?: string;
  iban?: string;
  banque?: string;
  factureCount?: number;
  userId?: number;
  userEmail?: string;
  userRole?: UserRole;
  userEnabled?: boolean;
}

export interface EmetteurRequest {
  code: string;
  raisonSociale: string;
  matriculeFiscal: string;
  formeJuridique: FormeJuridique;
  adresseComplete: string;
  pays?: string;
  region: RegionTunisie;
  email: string;
  telephone?: string;
  siteWeb?: string;
  iban?: string;
  banque?: string;
  userId?: number;
}
