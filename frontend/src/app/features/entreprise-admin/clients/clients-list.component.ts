import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { EmetteurService } from '../../../core/services/emetteur.service';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../models/client.model';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TableModule, ButtonModule, InputTextModule, TooltipModule, TagModule],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss'
})
export class ClientsListComponent implements OnInit {
  private authService = inject(AuthService);
  private emetteurService = inject(EmetteurService);
  private clientService = inject(ClientService);
  
  isReadOnly = computed(() => this.authService.hasRole('ENTREPRISE_VIEWER'));

  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = false;
  searchTerm = '';
  enterpriseName = 'Entreprise';

  ngOnInit(): void {
    this.loadEnterpriseName();
    this.loadClients();
  }

  private loadEnterpriseName(): void {
    try {
      const currentUser = this.authService.currentUser();
      console.log('🔍 Current user (Clients):', currentUser);
      
      if (!currentUser) {
        console.log('❌ No current user found');
        this.enterpriseName = 'Entreprise';
        return;
      }
      
      if (!currentUser.emetteurId) {
        console.log('⚠️  No emetteurId found in user:', { 
          id: currentUser.id, 
          email: currentUser.email,
          role: currentUser.role
        });
        this.enterpriseName = 'Entreprise';
        return;
      }

      console.log('📡 Fetching emetteur with ID:', currentUser.emetteurId);
      this.emetteurService.getEmetteurById(currentUser.emetteurId).subscribe({
        next: (emetteur: any) => {
          console.log('✅ Emetteur loaded:', emetteur);
          this.enterpriseName = emetteur?.raisonSociale || 'Entreprise';
          console.log('📝 Enterprise name set to:', this.enterpriseName);
        },
        error: (err: any) => {
          console.error('❌ Error fetching emetteur:', err);
          this.enterpriseName = 'Entreprise';
        },

        complete: () => {
          console.log('✔️  Emetteur subscription completed');
        }
      });
    } catch (error: any) {
      console.error('❌ Exception in loadEnterpriseName:', error);
      this.enterpriseName = 'Entreprise';
    }
  }

  private loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = [...this.clients];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des clients:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredClients = this.clients.filter(
      client =>
        client.raisonSociale.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }


  editClient(id: number | string): void {
    console.log('Edit client:', id);
  }

  deleteClient(id: number | string): void {
    if (confirm('Voulez-vous vraiment supprimer ce client ?')) {
      this.clientService.deleteClient(Number(id)).subscribe({
        next: () => {
          this.clients = this.clients.filter(c => c.id !== id);
          this.onSearch();
        },
        error: (err) => console.error('Error deleting client:', err)
      });
    }
  }
}
