import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { FactureItem } from '../../../models';
import { StatusBadgePipe } from '../../pipes/status-badge.pipe';

@Component({
  selector: 'app-facture-card',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule, StatusBadgePipe],
  templateUrl: './facture-card.component.html',
  styleUrl: './facture-card.component.scss'
})
export class FactureCardComponent {
  @Input() facture!: any;
  @Input() isLoading = false;
  @Output() viewDetails = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  getStatusBadge(): { label: string; severity: string; icon?: string } {
    return (this.facture.statut as any) || { label: 'Inconnu', severity: 'secondary' };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(value);
  }

  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('fr-TN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  onViewDetails(): void {
    this.viewDetails.emit();
  }

  onDownload(): void {
    this.download.emit();
  }
}
