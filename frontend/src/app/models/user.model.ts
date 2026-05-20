// À créer dans models/user.model.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  typeUser?: 'CLIENT' | 'EMETTEUR' | null;
  role?: 'ADMIN' | 'USER';
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  typeUser: 'CLIENT' | 'EMETTEUR' | null;
  nom: string;
  prenom: string;
  telephone: string;
}

export interface UserDTO {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: 'ADMIN' | 'USER';
  typeUser: 'CLIENT' | 'EMETTEUR' | null;
  enabled: boolean;
  clientId?: number;
  emetteurId?: number;
}