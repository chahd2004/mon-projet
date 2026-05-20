import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Facture } from '../../../models/facture.model';
import { FactureService } from '../../../core/services/facture.service';

@Component({
  selector: 'app-factures-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './factures-view.component.html',
  styleUrls: ['./factures-view.component.scss']
})
export class FacturesViewComponent implements OnInit {

  factures: Facture[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private factureService: FactureService) { }

  ngOnInit(): void {
    this.loadFactures();
  }

  loadFactures(): void {
    this.loading = true;
    this.error = '';
    this.factureService.getAll().subscribe({
      next: (data: Facture[]) => {
        this.factures = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des factures';
        console.error(err);
        this.loading = false;
      }
    });
  }

  getStatutClass(statut: string): string {
    return `statut-${statut.toLowerCase()}`;
  }

}
