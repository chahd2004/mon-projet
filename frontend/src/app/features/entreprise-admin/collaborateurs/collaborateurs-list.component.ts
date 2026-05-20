import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { CollaborateurService } from '../../../core/services/collaborateur.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface Collaborateur {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  dateAjout: string;
  isAdmin?: boolean;
}

@Component({
  selector: 'app-collaborateurs-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    TableModule, ButtonModule, InputTextModule, TooltipModule,
    ToastModule, ConfirmDialogModule, TranslateModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './collaborateurs-list.component.html',
  styleUrl: './collaborateurs-list.component.scss'
})
export class CollaborateursListComponent implements OnInit {
  private authService = inject(AuthService);
  private collaborateurService = inject(CollaborateurService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  collaborateurs: Collaborateur[] = [];
  filteredCollaborateurs: Collaborateur[] = [];
  isLoading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.loadCollaborateurs();
  }

  private loadCollaborateurs(): void {
    this.isLoading = true;
    this.collaborateurService.getCollaborateurs().subscribe({
      next: (data) => {
        const items = Array.isArray(data) ? data : (data as any).content || [];
        this.collaborateurs = items.map((c: any) => ({
          id: c.id?.toString() || '',
          prenom: c.prenom || c.firstName || '',
          nom: c.nom || c.lastName || '',
          email: c.email || '',
          role: c.role || 'ENTREPRISE_VIEWER',
          dateAjout: c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : 'N/A',
          isAdmin: false
        }));

        // Ajouter l'ENTREPRISE_ADMIN connecté en première ligne
        const currentUser = this.authService.currentUser();
        if (currentUser && currentUser.role === 'ENTREPRISE_ADMIN') {
          const adminEntry: Collaborateur = {
            id: currentUser.id?.toString() || '0',
            prenom: currentUser.prenom || '',
            nom: currentUser.nom || '',
            email: currentUser.email || '',
            role: 'ENTREPRISE_ADMIN',
            dateAjout: '—',
            isAdmin: true
          };
          this.collaborateurs = [adminEntry, ...this.collaborateurs];
        }

        this.filteredCollaborateurs = [...this.collaborateurs];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement collaborateurs:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredCollaborateurs = this.collaborateurs.filter(collab =>
      collab.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      collab.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      collab.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  deleteCollaborateur(id: string): void {
    this.confirmationService.confirm({
      message: this.translate.instant('COLLABORATEURS.CONFIRM.DELETE_MSG'),
      header: this.translate.instant('COLLABORATEURS.CONFIRM.DELETE_TITLE'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.collaborateurService.deleteCollaborateur(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translate.instant('COMMON.SUCCESS') || 'Succès',
              detail: this.translate.instant('COLLABORATEURS.CONFIRM.DELETE_SUCCESS')
            });
            this.collaborateurs = this.collaborateurs.filter(c => c.id !== id);
            this.onSearch();
          },
          error: (err: any) => {
            console.error('Erreur lors de la désactivation:', err);
            this.messageService.add({
              severity: 'error',
              summary: this.translate.instant('COMMON.ERROR') || 'Erreur',
              detail: this.translate.instant('COLLABORATEURS.CONFIRM.DELETE_ERROR')
            });
          }
        });
      }
    });
  }
}
