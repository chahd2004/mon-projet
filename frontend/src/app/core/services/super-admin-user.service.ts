import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponseDTO, AccountStatus } from '../../models';
import { BaseService } from './base.service';

export interface CreateSuperAdminRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminUserService extends BaseService {
  private readonly apiUrl = `${environment.apiUrl}/super-admin/users`;

  constructor(private http: HttpClient) {
    super();
  }

  getAllUsers(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(this.apiUrl, this.getHeaders());
  }

  changeUserStatus(id: number, status: AccountStatus): Observable<UserResponseDTO> {
    return this.http.patch<UserResponseDTO>(
      `${this.apiUrl}/${id}/status?status=${status}`,
      {},
      this.getHeaders()
    );
  }

  createSuperAdmin(request: CreateSuperAdminRequest): Observable<UserResponseDTO> {
    return this.http.post<UserResponseDTO>(
      `${this.apiUrl}/create-super-admin`,
      request,
      this.getHeaders()
    );
  }

  getUserById(id: number): Observable<UserResponseDTO> {
    return this.http.get<UserResponseDTO>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  updateUser(id: number, request: any): Observable<UserResponseDTO> {
    return this.http.put<UserResponseDTO>(`${this.apiUrl}/${id}`, request, this.getHeaders());
  }
}
