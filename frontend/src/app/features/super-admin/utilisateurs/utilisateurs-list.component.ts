import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountStatus, ADMIN_ROLES, UserDTO, UserResponseDTO, normalizeUserRole, UserRole } from '../../../models';
import { RoleLabelPipe } from '../../../shared';
import { SuperAdminUserService, CreateSuperAdminRequest } from '../../../core/services/super-admin-user.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { Emetteur } from '../../../models/emetteur.model';
import { DemandeService } from '../../../core/services/demande.service';

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule,
    TableModule, TagModule, TooltipModule, DropdownModule, SkeletonModule, RoleLabelPipe, TranslateModule,
    DialogModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './utilisateurs-list.component.html',
  styleUrl: './utilisateurs-list.component.scss'
})
export class UtilisateursListComponent implements OnInit {
  private readonly superAdminUserService = inject(SuperAdminUserService);
  private readonly emetteurService = inject(EmetteurService);
  private readonly demandeService = inject(DemandeService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private translate = inject(TranslateService);

  utilisateurs: UserDTO[] = [];
  filteredUtilisateurs: UserDTO[] = [];
  emetteursMap: Map<number, string> = new Map();
  emailToEntrepriseMap: Map<string, string> = new Map();
  isLoading = false;
  searchTerm = '';
  
  // Filtres
  selectedRole: string | null = null;
  selectedStatus: string | null = null;

  // Dialog & Form
  displayCreateDialog = false;
  createForm!: FormGroup;
  isSaving = false;

  // Options de filtres
  roleOptions = [];

  statusOptions = [];

  ngOnInit(): void {
    this.initOptions();
    this.initCreateForm();
    this.loadEmetteurs();
    this.loadDemandes();
    this.loadUtilisateurs();
  }

  private initCreateForm(): void {
    this.createForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmationMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): {[key: string]: any} | null {
    const motDePasse = form.get('motDePasse')?.value;
    const confirmation = form.get('confirmationMotDePasse')?.value;
    return motDePasse === confirmation ? null : { passwordMismatch: true };
  }

  private initOptions(): void {
    this.roleOptions = [
      { label: this.translate.instant('ROLES.SUPER_ADMIN'), value: 'SUPER_ADMIN' },
      { label: this.translate.instant('ROLES.ENTREPRISE_ADMIN'), value: 'ENTREPRISE_ADMIN' }
    ] as any;

    this.statusOptions = [
      { label: this.translate.instant('STATUS.ACTIVE'), value: 'ACTIVE' },
      { label: this.translate.instant('STATUS.DISABLED'), value: 'DISABLED' },
      { label: this.translate.instant('STATUS.PENDING'), value: 'PENDING' }
    ] as any;
    
    // Actually I should add STATUS.ACTIVE and STATUS.INACTIVE to standard status keys if not present.
    // Let's use STATUS.APPROVED for ACTIVE and STATUS.REJECTED for DISABLED for now if they fit, 
    // or better: use specific ones.
  }

  loadEmetteurs(): void {
    this.emetteurService.getEmetteurs().subscribe({
      next: (emetteurs) => {
        emetteurs.forEach(e => this.emetteursMap.set(e.id, e.raisonSociale));
      },
      error: (err) => console.error('Erreur chargement émetteurs:', err)
    });
  }

  loadDemandes(): void {
    this.demandeService.getDemandes().subscribe({
      next: (demandes: any[]) => {
        demandes.forEach(d => {
          if (d.email && d.raisonSociale) {
            this.emailToEntrepriseMap.set(d.email.toLowerCase(), d.raisonSociale);
          }
        });
      },
      error: (err) => console.error('Erreur chargement demandes:', err)
    });
  }

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.superAdminUserService.getAllUsers().subscribe({
      next: (users: UserResponseDTO[]) => {
        this.utilisateurs = users.map((u) => ({
          ...u,
          role: normalizeUserRole(u.role),
          createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : undefined
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.utilisateurs = [];
        this.filteredUtilisateurs = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();

    this.filteredUtilisateurs = this.utilisateurs.filter(u => {
      // Filtrer pour n'afficher que les administrateurs (Super Admin et Entreprise Admin)
      const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'ENTREPRISE_ADMIN'];
      if (!allowedRoles.includes(u.role)) {
        return false;
      }
      
      // Vérifier le filtre de rôle sélectionné
      if (this.selectedRole && u.role !== this.selectedRole) {
        return false;
      }

      // Vérifier le filtre de statut sélectionné
      if (this.selectedStatus && u.accountStatus !== this.selectedStatus) {
        return false;
      }

      // Vérifier la recherche par texte
      return !normalizedSearchTerm ||
        u.nom?.toLowerCase().includes(normalizedSearchTerm) ||
        u.prenom?.toLowerCase().includes(normalizedSearchTerm) ||
        u.email?.toLowerCase().includes(normalizedSearchTerm);
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = null;
    this.selectedStatus = null;
    this.applyFilters();
  }

  openCreateDialog(): void {
    this.createForm.reset();
    this.displayCreateDialog = true;
  }

  saveSuperAdmin(): void {
    if (!this.createForm.valid) {
      this.messageService.add({
        severity: 'error',
        summary: this.translate.instant('TOAST.ERROR'),
        detail: this.translate.instant('COMMON.FILL_ALL_FIELDS')
      });
      return;
    }

    this.isSaving = true;
    const formValue = this.createForm.getRawValue();
    const request: CreateSuperAdminRequest = {
      prenom: formValue.prenom,
      nom: formValue.nom,
      email: formValue.email,
      telephone: formValue.telephone,
      password: formValue.motDePasse
    };

    this.superAdminUserService.createSuperAdmin(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.displayCreateDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('TOAST.SUCCESS'),
          detail: this.translate.instant('SUPER_ADMIN.USERS.MSGS.CREATE_SUCCESS')
        });
        this.loadUtilisateurs();
      },
      error: (error) => {
        this.isSaving = false;
        const errorMessage = error?.error?.message || this.translate.instant('SUPER_ADMIN.USERS.MSGS.CREATE_ERROR');
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('TOAST.ERROR'),
          detail: errorMessage
        });
      }
    });
  }

  editUser(id: number): void {
    this.router.navigate(['/super-admin/utilisateurs', id, 'edit']);
  }

  disableUser(id: number): void {
    this.updateUserStatus(id, 'DISABLED');
  }

  enableUser(id: number): void {
    this.updateUserStatus(id, 'ACTIVE');
  }

  private updateUserStatus(id: number, status: AccountStatus): void {
    this.superAdminUserService.changeUserStatus(id, status).subscribe({
      next: (updatedUser) => {
        const index = this.utilisateurs.findIndex((u) => u.id === id);
        if (index !== -1) {
          this.utilisateurs[index] = {
            ...this.utilisateurs[index],
            accountStatus: updatedUser.accountStatus,
            enabled: updatedUser.enabled
          };
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    });
  }

  // Méthodes utilitaires pour l'affichage
  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      'SUPER_ADMIN': 'pi pi-crown',
      'ENTREPRISE_ADMIN': 'pi pi-building',
      'ENTREPRISE_VIEWER': 'pi pi-eye',
      'CLIENT': 'pi pi-shopping-cart',
      'EMETTEUR': 'pi pi-send'
    };
    return icons[role] || 'pi pi-user';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'ACTIVE': 'pi pi-check-circle',
      'DISABLED': 'pi pi-times-circle',
      'PENDING': 'pi pi-clock'
    };
    return icons[status] || 'pi pi-info-circle';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'ACTIVE': 'active',
      'DISABLED': 'disabled',
      'PENDING': 'pending'
    };
    return classes[status] || 'unknown';
  }

  getStatusLabel(status: string): string {
    const keyMap: Record<string, string> = {
      'ACTIVE': 'STATUS.ACTIVE',
      'DISABLED': 'STATUS.DISABLED',
      'PENDING': 'STATUS.PENDING',
      'REJECTED': 'STATUS.REJECTED'
    };
    return this.translate.instant(keyMap[status] || 'STATUS.UNKNOWN');
  }

  getEntrepriseName(user: any): string {
    // 1. Chercher l'ID (plusieurs noms possibles selon l'API)
    const id = user.entrepriseId || user.emetteurId || user.clientId || 
               user.entreprise_id || user.emetteur_id || user.client_id;
    
    // 2. Si on a un ID, chercher dans la map des émetteurs
    if (id && this.emetteursMap.has(Number(id))) {
      return this.emetteursMap.get(Number(id))!;
    }

    // 2b. Fallback par email si pas d'ID (pour les demandes récentes ou orphelines)
    if (user.email && this.emailToEntrepriseMap.has(user.email.toLowerCase())) {
      return this.emailToEntrepriseMap.get(user.email.toLowerCase())!;
    }

    // 3. Chercher le nom directement sur l'objet user (plusieurs variantes API possibles)
    const possibleNames = [
      user.raisonSociale,
      user.raison_sociale,
      user.nomEntreprise,
      user.entrepriseNom,
      user.emetteurNom,
      user.nomSociete,
      user.companyName
    ];

    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim()) return name;
    }

    // 4. Chercher dans des objets imbriqués
    if (user.entreprise?.raisonSociale) return user.entreprise.raisonSociale;
    if (user.emetteur?.raisonSociale) return user.emetteur.raisonSociale;
    if (user.entreprise?.raison_sociale) return user.entreprise.raison_sociale;
    if (user.emetteur?.raison_sociale) return user.emetteur.raison_sociale;

    // 5. Fallback si on a un ID mais pas de nom résolu
    if (id) return `ID: ${id}`;

    // 6. Aucun nom trouvé
    return '';
  }

  getObjectKeys(obj: any): string {
    if (!obj) return 'null';
    return Object.keys(obj).join(', ');
  }
}
