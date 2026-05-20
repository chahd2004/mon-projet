import { Pipe, PipeTransform } from '@angular/core';
import { AccountStatus, DemandeStatus, FactureStatus } from '../../models';

export type StatusType = AccountStatus | DemandeStatus | FactureStatus;

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  transform(status: StatusType | null | undefined): {
    label: string;
    severity: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
    icon?: string;
  } {
    if (!status) {
      return { label: 'Inconnu', severity: 'secondary' };
    }

    const statusMap: Record<StatusType, {
      label: string;
      severity: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
      icon?: string;
    }> = {
      // Account statuses
      PENDING: { label: 'En attente', severity: 'warning', icon: 'pi pi-clock' },
      ACTIVE: { label: 'Actif', severity: 'success', icon: 'pi pi-check' },
      DISABLED: { label: 'Désactivé', severity: 'danger', icon: 'pi pi-times' },
      EXPIRED: { label: 'Expiré', severity: 'danger', icon: 'pi pi-exclamation-triangle' },
      REQUESTED: { label: 'Demandé', severity: 'warning', icon: 'pi pi-send' },
      // Demande statuses
      APPROVED: { label: 'Approuvé', severity: 'success', icon: 'pi pi-check-circle' },
      // Facture statuses
      DRAFT: { label: 'Brouillon', severity: 'info', icon: 'pi pi-file' },
      SIGNED: { label: 'Signée', severity: 'success', icon: 'pi pi-check-square' },
      SENT: { label: 'Envoyée', severity: 'info', icon: 'pi pi-send' },
      PAID: { label: 'Payée', severity: 'success', icon: 'pi pi-check-circle' },
      REJECTED: { label: 'Rejetée', severity: 'danger', icon: 'pi pi-times-circle' },
      CANCELLED: { label: 'Annulée', severity: 'danger', icon: 'pi pi-times' }
    };

    return statusMap[status] || { label: status as string, severity: 'secondary' };
  }
}
