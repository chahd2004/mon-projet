import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AvoirService } from '../../core/services/avoir.service';
import { AuthService } from '../../core/services/auth.service';
import { Avoir, AvoirStatutLabel, AVOIR_STATUT_COLORS } from '../../models/avoir.model';

import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-avoirs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './avoirs.component.html',
  styleUrls: ['./avoirs.component.scss']
})
export class AvoirsComponent implements OnInit {
  private readonly avoirService = inject(AvoirService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  get isViewer(): boolean {
    return this.authService.hasRole('ENTREPRISE_VIEWER');
  }

  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));


  loading = false;
  errorMessage = '';
  infoMessage = '';
  searchQuery = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';

  avoirs: Avoir[] = [];

  get currentUser() {
    return this.authService.currentUser();
  }

  get userCompanyName(): string {
    const user = this.currentUser;
    if (!user) return 'Invité';
    
    // Si c'est un EMETTEUR, on affiche son nom/entreprise
    if (user.role === 'EMETTEUR' || user.role === 'ENTREPRISE_ADMIN' || user.role === 'ENTREPRISE_VIEWER') {
      return user.nom || 'Votre Entreprise';
    }
    
    return `${user.prenom} ${user.nom}`;
  }

  get currentStatusLabel(): string {
    if (this.statusFilter === 'ALL') return 'Tous';
    return AvoirStatutLabel[this.statusFilter as keyof typeof AvoirStatutLabel] || this.statusFilter;
  }

  get totalCount(): number {
    return this.filteredAvoirs.length;
  }

  get totalAvoirsCount(): number {
    return this.avoirs.filter(a => a.type === 'TOTAL').length;
  }

  get partielAvoirsCount(): number {
    return this.avoirs.filter(a => a.type === 'PARTIEL').length;
  }

  get filteredAvoirs(): Avoir[] {
    return this.avoirs.filter(avoir => {
      const numAvoir = avoir.numAvoir || '';
      const nomAcheteur = avoir.nomAcheteur || '';
      const factureSourceNum = avoir.factureSourceNum || '';

      const matchesSearch = !this.searchQuery || 
        numAvoir.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        nomAcheteur.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        factureSourceNum.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const currentStatut = (avoir.statut || '').trim().toUpperCase();
      const currentType = (avoir.type || '').trim().toUpperCase();

      const matchesStatus = this.statusFilter === 'ALL' || currentStatut === this.statusFilter;
      const matchesType = this.typeFilter === 'ALL' || currentType === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  ngOnInit(): void {
    this.loadAvoirs();
  }

  loadAvoirs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.avoirService.getAll().subscribe({
      next: (avoirs) => {
        console.log('✅ Avoirs chargés:', avoirs);
        const data = Array.isArray(avoirs) ? avoirs : [];
        
        // Remapping legacy 'APPLIED' status to 'SENT' for clean UI display
        this.avoirs = data.map(a => ({
          ...a,
          statut: (a.statut as string) === 'APPLIED' ? 'SENT' as any : a.statut
        }));
        
        this.loading = false;
        
        if (this.avoirs.length === 0) {
          console.warn('⚠️ Aucun avoir trouvé');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erreur chargement avoirs:', err);
        this.errorMessage = this.translate.instant('AVOIRS.MSGS.LOAD_ERROR') || 'Impossible de charger les avoirs.';
      }
    });
  }

  voirAvoir(avoir: Avoir): void {
    this.router.navigate(['/avoirs/view', avoir.id]);
  }

  modifierAvoir(avoir: Avoir): void {
    if (this.isViewer) return;
    this.router.navigate(['/avoirs/edit', avoir.id]);
  }

  envoyerAvoir(avoir: Avoir): void {
    if (this.isViewer) return;
    this.loading = true;
    this.avoirService.envoyerAvoir(avoir.id).subscribe({
      next: () => {
        this.loadAvoirs();
        this.infoMessage = this.translate.instant('AVOIRS.MSGS.SEND_SUCCESS', { num: avoir.numAvoir });
        setTimeout(() => this.infoMessage = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || this.translate.instant('AVOIRS.MSGS.SEND_ERROR');
      }
    });
  }

  validerAvoir(avoir: Avoir): void {
    if (this.isViewer) return;
    this.loading = true;
    this.avoirService.validerAvoir(avoir.id).subscribe({
      next: () => {
        this.loadAvoirs();
        this.infoMessage = this.translate.instant('AVOIRS.MSGS.VALIDATE_SUCCESS', { num: avoir.numAvoir });
        setTimeout(() => this.infoMessage = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || this.translate.instant('AVOIRS.MSGS.VALIDATE_ERROR');
      }
    });
  }



  formatStatut(statut: string): string {
    return AvoirStatutLabel[statut as keyof typeof AvoirStatutLabel] || statut;
  }

  getStatutColor(statut: string): string {
    return AVOIR_STATUT_COLORS[statut as keyof typeof AVOIR_STATUT_COLORS] || '#666666';
  }

  getStatusClass(statut: string): string {
    return (statut || '').toLowerCase();
  }

  goBack(): void {
    window.history.back();
  }


}
