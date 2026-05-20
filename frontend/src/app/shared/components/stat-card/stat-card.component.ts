import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

export interface KPIData {
  value: number | string;
  title: string;
  icon?: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input() data!: KPIData;
  @Input() isLoading = false;
  @Output() cardClicked = new EventEmitter<void>();

  getColorClass(): string {
    return `color-${this.data.color || 'blue'}`;
  }

  getTrendIcon(): string {
    switch (this.data.trend) {
      case 'up':
        return 'pi pi-arrow-up';
      case 'down':
        return 'pi pi-arrow-down';
      default:
        return 'pi pi-minus';
    }
  }

  getTrendClass(): string {
    switch (this.data.trend) {
      case 'up':
        return 'trend-up';
      case 'down':
        return 'trend-down';
      default:
        return 'trend-stable';
    }
  }

  onClick(): void {
    this.cardClicked.emit();
  }
}
