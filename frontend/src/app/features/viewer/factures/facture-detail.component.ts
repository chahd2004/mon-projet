import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Facture, LigneFacture } from '../../../models/facture.model';
import { FactureService } from '../../../core/services/facture.service';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './facture-detail.component.html',
  styleUrls: ['./facture-detail.component.scss']
})
export class FactureDetailComponent implements OnInit {

  facture: Facture | null = null;
  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private factureService: FactureService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadFacture(params['id']);
      }
    });
  }

  loadFacture(id: number): void {
    this.loading = true;
    this.error = '';
    this.factureService.getFactureById(id).subscribe({
      next: (data: Facture) => {
        this.facture = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement de la facture';
        console.error(err);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/viewer/factures']);
  }

  getStatutClass(statut: string): string {
    return `statut-${statut.toLowerCase()}`;
  }

}
