// src/app/models/parametres.model.ts
export interface Devise {
  code: string;
  libelle: string;
  symbole: string;
  pays: string;
  taux: number;
  precision: number;
  utilisable: boolean;
}

export interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'comptable';
}

export interface SocieteInfo {
  id: number;
  raison_sociale: string;
  adresse: string;
  email: string;
  telephone: string;
  matricule_fiscal: string;
  rc: string;
  iban: string;
  banque: string;
  logo?: string;
}

export interface Preferences {
  langue: 'fr' | 'ar' | 'en';
  devise: 'TND' | 'EUR' | 'USD';
  formatDate: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  theme: 'clair' | 'sombre' | 'systeme';
  notifications: {
    email: boolean;
    sms: boolean;
    desktop: boolean;
  };
}