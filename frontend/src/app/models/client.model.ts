// src/app/models/client.model.ts - Aligné avec le backend (camelCase)
export type RegionTunisie = 'ARIANA' | 'BEJA' | 'BEN_AROUS' | 'BIZERTE' | 'GABES' | 'GAFSA' | 'JENDOUBA' | 'KAIROUAN' | 'KASSERINE' | 'KEBILI' | 'KEF' | 'MAHDIA' | 'MANOUBA' | 'MEDENINE' | 'MONASTIR' | 'NABEUL' | 'SFAX' | 'SIDI_BOUZID' | 'SILIANA' | 'SOUSSE' | 'TATAOUINE' | 'TOZEUR' | 'TUNIS' | 'ZAGHOUAN';

export interface Client {
  id: number;
  raisonSociale: string;
  email: string;
  telephone: string;
  adresseComplete: string;
  pays: string;
  region: RegionTunisie | string;
}

export interface ClientRequest {
  raisonSociale: string;
  email: string;
  telephone: string;
  adresseComplete: string;
  pays: string;
  region: RegionTunisie;
}