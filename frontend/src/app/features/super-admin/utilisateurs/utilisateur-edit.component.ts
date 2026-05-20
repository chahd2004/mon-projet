import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserDTO, UserResponseDTO } from '../../../models';
import { SuperAdminUserService } from '../../../core/services/super-admin-user.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { DemandeService } from '../../../core/services/demande.service';
import { Emetteur } from '../../../models/emetteur.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-utilisateur-edit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    ButtonModule, InputTextModule, DropdownModule, CardModule,
    TranslateModule, ToastModule
  ],
  providers: [MessageService, TranslateService],
  templateUrl: './utilisateur-edit.component.html',
  styleUrl: './utilisateur-edit.component.scss'
})
export class UtilisateurEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private userService = inject(SuperAdminUserService);
  private emetteurService = inject(EmetteurService);
  private demandeService = inject(DemandeService);
  private messageService = inject(MessageService);

  editForm!: FormGroup;
  isLoading = false;
  isNew = false;
  user: UserDTO | null = null;
  emetteursData: Emetteur[] = [];

  roleOptions = [];
  emetteurOptions: { label: string; value: number | null }[] = [];

  ngOnInit(): void {
    this.initOptions();
    this.initForm();
    this.loadEmetteurs();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(parseInt(id));
    } else {
      this.isNew = true;
    }
  }

  private initOptions(): void {
    this.translate.get(['ROLES.SUPER_ADMIN', 'ROLES.ENTREPRISE_ADMIN']).subscribe(res => {
      this.roleOptions = [
        { label: res['ROLES.SUPER_ADMIN'], value: 'SUPER_ADMIN' },
        { label: res['ROLES.ENTREPRISE_ADMIN'], value: 'ENTREPRISE_ADMIN' }
      ] as any;
    });
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      role: ['', Validators.required],
      emetteurId: [null],
      enabled: [true]
    });
  }

  private loadEmetteurs(): void {
    this.emetteurService.getEmetteurs().subscribe({
      next: (data) => {
        this.emetteursData = data;
        this.emetteurOptions = [
          { label: 'Aucune (Super Admin / Sans entreprise)', value: null },
          ...data.map(e => ({ label: e.raisonSociale, value: e.id }))
        ];
        this.checkAutofillEmetteur();
      },
      error: (err) => console.error('Erreur chargement émetteurs:', err)
    });
  }

  private checkAutofillEmetteur(): void {
    if (this.user && this.emetteursData.length > 0) {
      if (!this.editForm.get('emetteurId')?.value && this.editForm.get('role')?.value !== 'SUPER_ADMIN') {
        const match = this.emetteursData.find(e => e.email === this.user?.email || e.userEmail === this.user?.email);
        if (match) {
          this.editForm.patchValue({ emetteurId: match.id });
        } else {
          // Fallback to DemandeService to match by reason social
          this.demandeService.getDemandes().subscribe(demandes => {
            const demande = demandes.find(d => d.email === this.user?.email);
            if (demande) {
              const emetteurMatch = this.emetteursData.find(e => e.raisonSociale === demande.raisonSociale);
              if (emetteurMatch) {
                this.editForm.patchValue({ emetteurId: emetteurMatch.id });
              }
            }
          });
        }
      }
    }
  }

  private loadUser(id: number): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (user: UserResponseDTO) => {
        this.user = {
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
        };
        this.editForm.patchValue(this.user);
        this.checkAutofillEmetteur();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger l\'utilisateur'
        });
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (!this.editForm.valid) {
      return;
    }
    this.isLoading = true;
    const body = this.editForm.value;
    
    if (this.isNew) {
      // Non implémenté ici car on utilise le dialogue de création dans la liste, 
      // mais on peut le faire si besoin.
      this.isLoading = false;
    } else if (this.user) {
      this.userService.updateUser(this.user.id, body).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Utilisateur mis à jour avec succès'
          });
          setTimeout(() => this.router.navigate(['/super-admin/utilisateurs']), 1500);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur mise à jour:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour'
          });
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/super-admin/utilisateurs']);
  }
}
